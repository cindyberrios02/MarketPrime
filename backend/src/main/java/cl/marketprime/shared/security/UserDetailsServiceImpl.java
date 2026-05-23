// shared/security/UserDetailsServiceImpl.java
package cl.marketprime.shared.security;

import cl.marketprime.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return userRepository.findByEmail(email)
                .filter(u -> u.isActive())
                .map(user -> org.springframework.security.core.userdetails.User.builder()
                        .username(user.getEmail())
                        .password(user.getPasswordHash())
                        .authorities(
                                user.getRoles().stream()
                                        .map(role -> new SimpleGrantedAuthority(role.getName().name()))
                                        .toList()
                        )
                        .build()
                )
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }
}