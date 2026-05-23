// store/dto/StoreResponse.java
package cl.marketprime.store.dto;

import cl.marketprime.store.StoreStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record StoreResponse(
        UUID id,
        String storeName,
        String slug,
        String description,
        String logoUrl,
        String bannerUrl,
        StoreStatus status,
        BigDecimal commissionRate,
        String ownerEmail,
        String ownerFirstName,
        Instant createdAt,
        Instant approvedAt
) {}