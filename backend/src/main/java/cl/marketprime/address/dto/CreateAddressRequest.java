// address/dto/CreateAddressRequest.java
package cl.marketprime.address.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateAddressRequest(

        @NotBlank(message = "Alias is required")
        @Size(max = 60)
        String alias,

        @NotBlank(message = "Recipient name is required")
        @Size(max = 120)
        String recipientName,

        @Size(max = 20)
        String phone,

        @NotBlank(message = "Street is required")
        @Size(max = 200)
        String street,

        @Size(max = 10)
        String number,

        @Size(max = 30)
        String apartment,

        @NotBlank(message = "City is required")
        @Size(max = 100)
        String city,

        @NotBlank(message = "Region is required")
        @Size(max = 100)
        String region,

        @Size(max = 10)
        String zipCode,

        Boolean isDefault
) {}
