// order/dto/PlaceOrderRequest.java
package cl.marketprime.order.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record PlaceOrderRequest(
        @NotNull(message = "Shipping address ID is required")
        UUID shippingAddressId
) {}
