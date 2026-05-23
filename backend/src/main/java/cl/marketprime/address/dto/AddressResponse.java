// address/dto/AddressResponse.java
package cl.marketprime.address.dto;

import java.time.Instant;
import java.util.UUID;

public record AddressResponse(
        UUID    id,
        String  alias,
        String  recipientName,
        String  phone,
        String  street,
        String  number,
        String  apartment,
        String  city,
        String  region,
        String  zipCode,
        String  country,
        boolean isDefault,
        Instant createdAt
) {}
