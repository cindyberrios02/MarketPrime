// order/AdminOrderController.java
package cl.marketprime.order;

import cl.marketprime.order.dto.OrderSummaryResponse;
import cl.marketprime.shared.dto.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/orders")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminOrderController {

    private final OrderService orderService;

    @GetMapping
    public PageResponse<OrderSummaryResponse> getAdminOrders(
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable
    ) {
        return PageResponse.of(orderService.getAdminOrders(pageable));
    }
}
