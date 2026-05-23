// category/dto/CreateCategoryRequest.java
package cl.marketprime.category.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateCategoryRequest(

        @NotBlank @Size(min = 2, max = 100)
        String name,

        @NotBlank @Size(min = 2, max = 120)
        @Pattern(regexp = "^[a-z0-9]+(?:-[a-z0-9]+)*$",
                message = "Slug must be lowercase letters, numbers and hyphens only")
        String slug,

        UUID parentId,    // null = categoría raíz

        String iconUrl,

        Integer displayOrder
) {}