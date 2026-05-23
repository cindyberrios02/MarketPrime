// store/dto/CreateStoreRequest.java
package cl.marketprime.store.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateStoreRequest(

        @NotBlank @Size(min = 3, max = 120)
        String storeName,

        // slug: solo minúsculas, números y guiones
        @NotBlank
        @Size(min = 3, max = 120)
        @Pattern(regexp = "^[a-z0-9]+(?:-[a-z0-9]+)*$",
                message = "Slug must be lowercase letters, numbers and hyphens only")
        String slug,

        @Size(max = 1000)
        String description
) {}