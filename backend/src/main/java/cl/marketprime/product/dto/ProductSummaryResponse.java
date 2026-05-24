// product/dto/ProductSummaryResponse.java
// Versión ligera para listados — sin description ni imágenes completas
package cl.marketprime.product.dto;

import cl.marketprime.product.ProductStatus;

import java.math.BigDecimal;
import java.util.UUID;

public record ProductSummaryResponse(
        UUID id,
        String name,
        String slug,
        BigDecimal basePrice,
        BigDecimal salePrice,
        BigDecimal effectivePrice,
        Integer stockQuantity,
        ProductStatus status,
        String categoryName,
        String storeName,
        String storeSlug,
        String primaryImageUrl,  // solo la imagen principal
        java.util.List<String> imageUrls, // TODAS las imagenes para el slider
        // Frontend compatibility aliases:
        BigDecimal price,
        String imageUrl,
        Integer stock,
        Double averageRating,
        Long reviewsCount
) {}