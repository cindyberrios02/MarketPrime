// review/ReviewRepository.java
package cl.marketprime.review;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface ReviewRepository extends JpaRepository<Review, UUID> {

    Page<Review> findAllByProductId(UUID productId, Pageable pageable);

    boolean existsByProductIdAndUserId(UUID productId, UUID userId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.product.id = :productId")
    Double getAverageRatingForProduct(@Param("productId") UUID productId);

    long countByProductId(UUID productId);

    @Query("SELECT r FROM Review r WHERE r.product.store.id = :storeId ORDER BY r.createdAt DESC")
    java.util.List<Review> findAllByStoreId(@Param("storeId") UUID storeId);
}
