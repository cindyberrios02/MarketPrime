package cl.marketprime.store.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record StorePublicProfileResponse(
        UUID id,
        String storeName,
        String slug,
        String description,
        String logoUrl,
        String bannerUrl,
        Double averageRating,
        Long totalSales,
        Double onTimeDeliveryRate,
        String satisfactionLevel,
        List<StoreReviewResponse> reviews,
        Instant createdAt
) {
    public record StoreReviewResponse(
            UUID id,
            String buyerName,
            String productName,
            String productSlug,
            Integer rating,
            String comment,
            Instant createdAt
    ) {}
}
