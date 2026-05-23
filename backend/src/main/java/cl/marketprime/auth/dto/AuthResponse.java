// auth/dto/AuthResponse.java
package cl.marketprime.auth.dto;

import java.util.Set;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        String email,
        String firstName,
        Set<String> roles
) {}