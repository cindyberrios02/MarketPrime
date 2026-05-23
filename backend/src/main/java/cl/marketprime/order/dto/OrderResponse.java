// order/dto/OrderResponse.java
package cl.marketprime.order.dto;

import cl.marketprime.order.OrderStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record OrderResponse(
        UUID                    id,
        OrderStatus             status,
        BigDecimal              totalAmount,
        BigDecimal              shippingCost,
        UUID                    storeId,
        String                  storeName,
        String                  storeSlug,
        String                  buyerEmail,
        UUID                    shippingAddressId,
        String                  shippingAddressSnapshot,
        List<OrderItemResponse> items,
        Instant                 createdAt,
        Instant                 updatedAt
) {}
