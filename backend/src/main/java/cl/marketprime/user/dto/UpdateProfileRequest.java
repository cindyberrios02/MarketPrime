// user/dto/UpdateProfileRequest.java
package cl.marketprime.user.dto;

import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @Size(max = 80, message = "First name must not exceed 80 characters")
        String firstName,

        @Size(max = 80, message = "Last name must not exceed 80 characters")
        String lastName,

        @Size(max = 20, message = "Phone must not exceed 20 characters")
        String phone
) {}
