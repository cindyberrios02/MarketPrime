// address/AddressRepository.java
package cl.marketprime.address;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AddressRepository extends JpaRepository<Address, UUID> {

    List<Address> findAllByUserIdOrderByIsDefaultDescCreatedAtDesc(UUID userId);

    Optional<Address> findByIdAndUserId(UUID id, UUID userId);

    boolean existsByUserId(UUID userId);

    Optional<Address> findFirstByUserIdAndIsDefaultTrue(UUID userId);
}
