// user/dto/UserProfileResponse.java
package cl.marketprime.user.dto;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

public record UserProfileResponse(
        UUID        id,
        String      email,
        String      firstName,
        String      lastName,
        String      phone,
        Set<String> roles,
        Instant     createdAt
) {}
