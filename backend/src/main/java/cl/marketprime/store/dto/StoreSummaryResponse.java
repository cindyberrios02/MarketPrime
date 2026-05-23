// store/dto/StoreSummaryResponse.java
// Versión ligera para listados públicos (menos datos sensibles)
package cl.marketprime.store.dto;

import java.util.UUID;

public record StoreSummaryResponse(
        UUID id,
        String storeName,
        String slug,
        String logoUrl,
        String description
) {}