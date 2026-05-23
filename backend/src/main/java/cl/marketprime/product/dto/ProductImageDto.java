// product/dto/ProductImageDto.java
package cl.marketprime.product.dto;

import java.util.UUID;

public record ProductImageDto(
        UUID id,
        String url,
        String altText,
        boolean isPrimary,
        int displayOrder
) {}