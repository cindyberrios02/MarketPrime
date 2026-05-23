// cart/dto/CartItemResponse.java
package cl.marketprime.cart.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record CartItemResponse(
        UUID       id,
        UUID       productId,
        String     productName,
        String     productSlug,
        String     imageUrl,
        BigDecimal unitPrice,
        Integer    quantity,
        BigDecimal subtotal,
        UUID       storeId,
        String     storeName,
        String     storeSlug
) {}
