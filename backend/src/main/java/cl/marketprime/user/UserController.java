// user/UserController.java
package cl.marketprime.user;

import cl.marketprime.user.dto.ChangePasswordRequest;
import cl.marketprime.user.dto.UpdateProfileRequest;
import cl.marketprime.user.dto.UserProfileResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users/me")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('BUYER', 'SELLER', 'ADMIN')")
public class UserController {

    private final UserService userService;

    @GetMapping
    public UserProfileResponse getProfile(@AuthenticationPrincipal UserDetails principal) {
        return userService.getProfile(principal.getUsername());
    }

    @PatchMapping
    public UserProfileResponse updateProfile(
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody UpdateProfileRequest request
    ) {
        return userService.updateProfile(principal.getUsername(), request);
    }

    @PatchMapping("/password")
    public void changePassword(
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        userService.changePassword(principal.getUsername(), request);
    }
}
