package cl.marketprime.order;

import cl.transbank.webpay.webpayplus.WebpayPlus;
import cl.transbank.webpay.webpayplus.responses.WebpayPlusTransactionCommitResponse;
import cl.transbank.webpay.webpayplus.responses.WebpayPlusTransactionCreateResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Slf4j
public class PaymentController {

    private final OrderRepository orderRepository;
    private final OrderService orderService;

    public record PaymentInitRequest(List<UUID> orderIds, UUID orderId) {}
    public record PaymentInitResponse(String token, String url) {}

    @PostMapping("/init")
    @PreAuthorize("isAuthenticated()")
    public PaymentInitResponse initializePayment(
            @AuthenticationPrincipal UserDetails principal,
            @RequestBody PaymentInitRequest requestBody,
            HttpServletRequest request
    ) {
        List<UUID> orderIds = requestBody.orderIds();
        if (orderIds == null || orderIds.isEmpty()) {
            if (requestBody.orderId() != null) {
                orderIds = List.of(requestBody.orderId());
            } else {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing orderIds");
            }
        }

        List<Order> orders = orderRepository.findAllById(orderIds);
        if (orders.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No orders found");
        }

        // Verify ownership and validate status
        double totalAmount = 0.0;
        for (Order order : orders) {
            if (!order.getUser().getEmail().equals(principal.getUsername())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not authorized to pay for these orders");
            }
            if (order.getStatus() != OrderStatus.PENDING) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only PENDING orders can be paid");
            }
            totalAmount += order.getTotalAmount().doubleValue();
        }

        try {
            // Webpay buyOrder has 26-char limit, use first order ID to represent the batch
            String buyOrder = orders.get(0).getId().toString().replaceAll("-", "").substring(0, 26);
            String sessionId = principal.getUsername();

            // Construct returnUrl dynamically based on incoming request host
            String scheme = request.getScheme();
            String host = request.getHeader("Host");
            // If request went through proxy, use forwarded headers if available, or fallback
            String forwardedHost = request.getHeader("X-Forwarded-Host");
            String forwardedProto = request.getHeader("X-Forwarded-Proto");
            
            String finalProto = (forwardedProto != null) ? forwardedProto : scheme;
            String finalHost = (forwardedHost != null) ? forwardedHost : host;
            
            String returnUrl = finalProto + "://" + finalHost + "/api/payments/return";

            log.info("Initializing Webpay Plus transaction for orders {} with total amount {} and returnUrl: {}", 
                    orderIds, totalAmount, returnUrl);

            // Create Webpay Plus Transaction
            WebpayPlusTransactionCreateResponse createResponse = new WebpayPlus.Transaction().create(
                    buyOrder,
                    sessionId,
                    totalAmount,
                    returnUrl
            );

            // Store payment token in all orders in the batch
            String token = createResponse.getToken();
            for (Order order : orders) {
                order.setPaymentToken(token);
                orderRepository.save(order);
            }

            return new PaymentInitResponse(token, createResponse.getUrl());

        } catch (Exception e) {
            log.error("Failed to initialize Webpay transaction for orders {}", orderIds, e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Webpay initialization error: " + e.getMessage());
        }
    }

    @RequestMapping(value = "/return", method = {RequestMethod.GET, RequestMethod.POST})
    public void handleReturn(
            @RequestParam(value = "token_ws", required = false) String tokenWs,
            @RequestParam(value = "TBK_TOKEN", required = false) String tbkToken,
            @RequestParam(value = "TBK_ORDEN_COMPRA", required = false) String tbkOrdenCompra,
            HttpServletResponse response
    ) throws IOException {
        log.info("Webpay Plus return callback triggered. token_ws: {}, TBK_TOKEN: {}, TBK_ORDEN_COMPRA: {}", tokenWs, tbkToken, tbkOrdenCompra);

        String activeToken = (tokenWs != null) ? tokenWs : tbkToken;

        if (activeToken == null) {
            log.warn("Webpay return callback received with no tokens.");
            response.sendRedirect("/checkout/failed");
            return;
        }

        // Find associated orders
        List<Order> orders = orderRepository.findAllByPaymentToken(activeToken);
        if (orders.isEmpty()) {
            log.error("No orders found with payment token: {}", activeToken);
            response.sendRedirect("/checkout/failed");
            return;
        }

        String orderIdsStr = orders.stream()
                .map(o -> o.getId().toString())
                .collect(Collectors.joining(","));

        // If TBK_TOKEN is returned but not token_ws, or it's a known aborted flow
        if (tokenWs == null) {
            log.warn("Transaction aborted by user. Token: {}, Orders count: {}", tbkToken, orders.size());
            for (Order order : orders) {
                orderService.markOrderAsCancelled(order);
            }
            response.sendRedirect("/checkout/failed?orderIds=" + orderIdsStr);
            return;
        }

        try {
            // Commit transaction on Transbank
            WebpayPlusTransactionCommitResponse commitResponse = new WebpayPlus.Transaction().commit(tokenWs);
            
            log.info("Webpay commit response: code={}, status={}, authorizationCode={}", 
                    commitResponse.getResponseCode(), commitResponse.getStatus(), commitResponse.getAuthorizationCode());

            if (commitResponse.getResponseCode() == 0) {
                // Payment Approved!
                for (Order order : orders) {
                    orderService.markOrderAsConfirmed(order);
                }
                log.info("Payment approved for orders. Status updated to CONFIRMED.");
                response.sendRedirect("/checkout/success?token=" + tokenWs + "&orderIds=" + orderIdsStr);
            } else {
                // Payment Rejected
                for (Order order : orders) {
                    orderService.markOrderAsCancelled(order);
                }
                log.warn("Payment rejected for orders. Status updated to CANCELLED.");
                response.sendRedirect("/checkout/failed?orderIds=" + orderIdsStr);
            }

        } catch (Exception e) {
            log.error("Error committing Webpay transaction for token {}", tokenWs, e);
            for (Order order : orders) {
                orderService.markOrderAsCancelled(order);
            }
            response.sendRedirect("/checkout/failed?orderIds=" + orderIdsStr);
        }
    }
}
