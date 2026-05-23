// product/dto/CreateProductRequest.java
package cl.marketprime.product.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.UUID;

public record CreateProductRequest(

        @NotBlank @Size(min = 3, max = 200)
        String name,

        @NotBlank @Size(max = 220)
        String slug,

        @Size(max = 5000)
        String description,

        @NotNull @DecimalMin("0.01") @Digits(integer = 10, fraction = 2)
        BigDecimal basePrice,

        @DecimalMin("0.01") @Digits(integer = 10, fraction = 2)
        BigDecimal salePrice,        // nullable

        @NotNull @Min(0)
        Integer stockQuantity,

        @NotNull
        UUID categoryId
) {}