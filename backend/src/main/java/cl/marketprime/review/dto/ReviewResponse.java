// review/dto/ReviewResponse.java
package cl.marketprime.review.dto;

import java.time.Instant;
import java.util.UUID;

public record ReviewResponse(
        UUID    id,
        UUID    productId,
        UUID    userId,
        String  userFirstName,
        String  userLastName,
        Integer rating,
        String  comment,
        Instant createdAt
) {}
