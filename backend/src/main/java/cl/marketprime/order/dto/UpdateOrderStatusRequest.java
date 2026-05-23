// order/dto/UpdateOrderStatusRequest.java
package cl.marketprime.order.dto;

import cl.marketprime.order.OrderStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateOrderStatusRequest(
        @NotNull(message = "Status is required")
        OrderStatus status
) {}
