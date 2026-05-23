// product/dto/ProductResponse.java
package cl.marketprime.product.dto;

import cl.marketprime.product.ProductStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ProductResponse(
        UUID id,
        String name,
        String slug,
        String description,
        BigDecimal basePrice,
        BigDecimal salePrice,
        BigDecimal effectivePrice,   // salePrice si existe, sino basePrice
        Integer stockQuantity,
        ProductStatus status,
        boolean isFeatured,
        UUID categoryId,
        String categoryName,
        UUID storeId,
        String storeName,
        String storeSlug,
        List<ProductImageDto> images,
        Instant createdAt,
        Instant updatedAt,
        // Frontend compatibility aliases:
        BigDecimal price,
        String imageUrl,
        Integer stock,
        Double averageRating,
        Long reviewsCount
) {}