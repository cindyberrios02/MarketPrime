// order/SellerOrderController.java
package cl.marketprime.order;

import cl.marketprime.order.dto.OrderResponse;
import cl.marketprime.order.dto.OrderSummaryResponse;
import cl.marketprime.order.dto.UpdateOrderStatusRequest;
import cl.marketprime.shared.dto.PageResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/seller/orders")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SELLER')")
public class SellerOrderController {

    private final OrderService orderService;

    @GetMapping
    public PageResponse<OrderSummaryResponse> getStoreOrders(
            @AuthenticationPrincipal UserDetails principal,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable
    ) {
        return PageResponse.of(orderService.getStoreOrders(principal.getUsername(), pageable));
    }

    @PatchMapping("/{id}/status")
    public OrderResponse updateOrderStatus(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateOrderStatusRequest request
    ) {
        return orderService.updateOrderStatus(principal.getUsername(), id, request.status());
    }
}
