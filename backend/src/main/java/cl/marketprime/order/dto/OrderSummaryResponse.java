// order/dto/OrderSummaryResponse.java
package cl.marketprime.order.dto;

import cl.marketprime.order.OrderStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record OrderSummaryResponse(
        UUID        id,
        OrderStatus status,
        BigDecimal  totalAmount,
        BigDecimal  shippingCost,
        String      storeName,
        String      buyerEmail,
        String      shippingAddressSnapshot,
        Integer     totalItems,
        Instant     createdAt
) {}
