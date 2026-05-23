// order/OrderRepository.java
package cl.marketprime.order;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrderRepository extends JpaRepository<Order, UUID> {

    Page<Order> findAllByUserId(UUID userId, Pageable pageable);

    Optional<Order> findByIdAndUserId(UUID id, UUID userId);

    Optional<Order> findByPaymentToken(String paymentToken);

    List<Order> findAllByPaymentToken(String paymentToken);

    Page<Order> findAllByStoreId(UUID storeId, Pageable pageable);

    Optional<Order> findByIdAndStoreId(UUID orderId, UUID storeId);

    long countByStoreIdAndStatusIn(UUID storeId, java.util.Collection<OrderStatus> statuses);

    @Query("""
        SELECT COUNT(o) > 0 FROM Order o
        JOIN o.items i
        WHERE o.user.id = :userId
        AND i.product.id = :productId
        AND o.status IN (cl.marketprime.order.OrderStatus.CONFIRMED, cl.marketprime.order.OrderStatus.SHIPPED, cl.marketprime.order.OrderStatus.DELIVERED)
        """)
    boolean existsByUserIdAndProductIdAndPurchased(@Param("userId") UUID userId, @Param("productId") UUID productId);
}
