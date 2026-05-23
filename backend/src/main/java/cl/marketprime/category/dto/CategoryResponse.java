// category/dto/CategoryResponse.java
package cl.marketprime.category.dto;

import java.util.List;
import java.util.UUID;

public record CategoryResponse(
        UUID id,
        String name,
        String slug,
        String iconUrl,
        int displayOrder,
        List<CategoryResponse> children   // subcategorías anidadas
) {}