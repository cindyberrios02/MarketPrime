// product/dto/UpdateProductRequest.java
package cl.marketprime.product.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.UUID;

public record UpdateProductRequest(

        @Size(min = 3, max = 200)
        String name,

        @Size(max = 5000)
        String description,

        @DecimalMin("0.01") @Digits(integer = 10, fraction = 2)
        BigDecimal basePrice,

        @DecimalMin("0.01") @Digits(integer = 10, fraction = 2)
        BigDecimal salePrice,

        @Min(0)
        Integer stockQuantity,

        UUID categoryId,

        String status   // DRAFT, ACTIVE, PAUSED — el seller puede cambiar esto
) {}