// order/OrderController.java
package cl.marketprime.order;

import cl.marketprime.order.dto.OrderResponse;
import cl.marketprime.order.dto.OrderSummaryResponse;
import cl.marketprime.order.dto.PlaceOrderRequest;
import cl.marketprime.shared.dto.PageResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('BUYER', 'SELLER', 'ADMIN')")
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public java.util.List<OrderResponse> placeOrder(
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody PlaceOrderRequest request
    ) {
        return orderService.placeOrder(principal.getUsername(), request);
    }

    @GetMapping
    public PageResponse<OrderSummaryResponse> getMyOrders(
            @AuthenticationPrincipal UserDetails principal,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable
    ) {
        return PageResponse.of(orderService.getMyOrders(principal.getUsername(), pageable));
    }

    @GetMapping("/{id}")
    public OrderResponse getOrderDetail(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable UUID id
    ) {
        return orderService.getOrderDetail(principal.getUsername(), id);
    }

    @PostMapping("/{id}/cancel")
    public OrderResponse cancelOrder(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable UUID id
    ) {
        return orderService.cancelOrder(principal.getUsername(), id);
    }
}
