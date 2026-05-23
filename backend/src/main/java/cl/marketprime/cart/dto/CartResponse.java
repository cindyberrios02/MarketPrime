// cart/dto/CartResponse.java
package cl.marketprime.cart.dto;

import java.math.BigDecimal;
import java.util.List;

public record CartResponse(
        List<CartItemResponse> items,
        Integer                totalItems,
        BigDecimal             totalAmount
) {}
