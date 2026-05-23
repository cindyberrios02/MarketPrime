// wishlist/dto/WishlistResponse.java
package cl.marketprime.wishlist.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record WishlistResponse(
        UUID       id,
        UUID       productId,
        String     productName,
        String     productSlug,
        String     imageUrl,
        BigDecimal unitPrice,
        boolean    inStock,
        Instant    addedAt,
        // Frontend compatibility aliases
        String     name,
        String     slug,
        BigDecimal price
) {}
