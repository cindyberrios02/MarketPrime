// store/StoreProfileRepository.java
package cl.marketprime.store;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface StoreProfileRepository extends JpaRepository<StoreProfile, UUID> {

    Optional<StoreProfile> findBySlug(String slug);
    Optional<StoreProfile> findByUserId(UUID userId);
    boolean existsBySlug(String slug);
    boolean existsByUserId(UUID userId);
    Page<StoreProfile> findAllByStatus(StoreStatus status, Pageable pageable);
}