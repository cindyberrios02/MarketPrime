// store/dto/UpdateStoreRequest.java
package cl.marketprime.store.dto;

import jakarta.validation.constraints.Size;

public record UpdateStoreRequest(

        @Size(min = 3, max = 120)
        String storeName,

        @Size(max = 1000)
        String description,

        @Size(max = 500)
        String logoUrl,

        @Size(max = 500)
        String bannerUrl
) {}