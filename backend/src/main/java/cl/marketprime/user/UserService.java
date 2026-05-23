// user/UserService.java
package cl.marketprime.user;

import cl.marketprime.user.dto.ChangePasswordRequest;
import cl.marketprime.user.dto.UpdateProfileRequest;
import cl.marketprime.user.dto.UserProfileResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository  userRepository;
    private final PasswordEncoder passwordEncoder;

    // ─── Obtener perfil ───────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(String email) {
        User user = findUser(email);
        return toResponse(user);
    }

    // ─── Actualizar perfil ────────────────────────────────────────────────────

    @Transactional
    public UserProfileResponse updateProfile(String email, UpdateProfileRequest request) {
        User user = findUser(email);

        if (request.firstName() != null) user.setFirstName(request.firstName());
        if (request.lastName()  != null) user.setLastName(request.lastName());
        if (request.phone()     != null) user.setPhone(request.phone());

        return toResponse(userRepository.save(user));
    }

    // ─── Cambiar contraseña ───────────────────────────────────────────────────

    @Transactional
    public void changePassword(String email, ChangePasswordRequest request) {
        User user = findUser(email);

        // 1. Validar contraseña actual
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid current password");
        }

        // 2. Encriptar y actualizar nueva contraseña
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }

    private UserProfileResponse toResponse(User u) {
        Set<String> roles = u.getRoles().stream()
                .map(r -> r.getName().name())
                .collect(Collectors.toSet());

        return new UserProfileResponse(
                u.getId(),
                u.getEmail(),
                u.getFirstName(),
                u.getLastName(),
                u.getPhone(),
                roles,
                u.getCreatedAt()
        );
    }
}
