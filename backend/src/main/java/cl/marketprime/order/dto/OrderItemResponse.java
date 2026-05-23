// order/dto/OrderItemResponse.java
package cl.marketprime.order.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record OrderItemResponse(
        UUID       id,
        UUID       productId,
        String     productName,
        String     productSlug,
        String     imageUrl,
        UUID       storeId,
        String     storeName,
        Integer    quantity,
        BigDecimal unitPrice,
        BigDecimal subtotal
) {}
