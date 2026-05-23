// auth/AuthService.java
package cl.marketprime.auth;

import cl.marketprime.auth.dto.AuthResponse;
import cl.marketprime.auth.dto.LoginRequest;
import cl.marketprime.auth.dto.RegisterRequest;
import cl.marketprime.role.RoleName;
import cl.marketprime.role.RoleRepository;
import cl.marketprime.shared.exception.ConflictException;
import cl.marketprime.shared.security.JwtService;
import cl.marketprime.user.User;
import cl.marketprime.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository       userRepository;
    private final RoleRepository       roleRepository;
    private final PasswordEncoder      passwordEncoder;
    private final JwtService           jwtService;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService   userDetailsService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new ConflictException("Email already in use: " + request.email());
        }

        var buyerRole = roleRepository.findByName(RoleName.ROLE_BUYER)
                .orElseThrow(() -> new IllegalStateException("ROLE_BUYER not found. Run data seeder."));

        var user = User.builder()
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .firstName(request.firstName())
                .lastName(request.lastName())
                .roles(Set.of(buyerRole))
                .build();

        userRepository.save(user);

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        return buildAuthResponse(userDetails, user);
    }

    public AuthResponse login(LoginRequest request) {
        // Lanza BadCredentialsException si falla — Spring lo maneja
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );

        UserDetails userDetails = userDetailsService.loadUserByUsername(request.email());
        User user = userRepository.findByEmail(request.email()).orElseThrow();
        return buildAuthResponse(userDetails, user);
    }

    // ---------- Private ----------

    private AuthResponse buildAuthResponse(UserDetails userDetails, User user) {
        String accessToken  = jwtService.generateAccessToken(userDetails);
        String refreshToken = jwtService.generateRefreshToken(userDetails);

        Set<String> roleNames = user.getRoles().stream()
                .map(r -> r.getName().name())
                .collect(Collectors.toSet());

        return new AuthResponse(accessToken, refreshToken, user.getEmail(), user.getFirstName(), roleNames);
    }
}