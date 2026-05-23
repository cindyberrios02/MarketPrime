// product/ProductRepository.java
package cl.marketprime.product;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface ProductRepository extends JpaRepository<Product, UUID> {

    Optional<Product> findBySlug(String slug);
    boolean existsBySlug(String slug);

    // Productos de una tienda (para el seller dashboard)
    Page<Product> findAllByStoreIdAndStatusNot(
            UUID storeId, ProductStatus status, Pageable pageable);

    // Browsing público — solo ACTIVE, excluyendo DELETED
    Page<Product> findAllByStatusAndStoreId(
            ProductStatus status, UUID storeId, Pageable pageable);

    // Browsing por categoría (con tienda activa)
    @Query("""
            SELECT p FROM Product p
            WHERE p.status = :status
            AND p.store.status = cl.marketprime.store.StoreStatus.ACTIVE
            AND p.category.id = :categoryId
            """)
    Page<Product> findAllByStatusAndCategoryIdAndStoreStatusActive(
            @Param("status") ProductStatus status,
            @Param("categoryId") UUID categoryId,
            Pageable pageable);

    // Browsing por categorías e hijas (con tienda activa)
    @Query("""
            SELECT p FROM Product p
            WHERE p.status = :status
            AND p.store.status = cl.marketprime.store.StoreStatus.ACTIVE
            AND p.category.id IN :categoryIds
            """)
    Page<Product> findAllByStatusAndCategoryIdInAndStoreStatusActive(
            @Param("status") ProductStatus status,
            @Param("categoryIds") java.util.Collection<UUID> categoryIds,
            Pageable pageable);

    // Búsqueda por nombre (con tienda activa, case-insensitive)
    @Query("""
            SELECT p FROM Product p
            WHERE p.status = :status
            AND p.store.status = cl.marketprime.store.StoreStatus.ACTIVE
            AND LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%'))
            """)
    Page<Product> searchByName(
            @Param("status") ProductStatus status,
            @Param("query") String query,
            Pageable pageable);

    @Query("""
            SELECT p FROM Product p
            WHERE p.status = :status
            AND p.store.slug = :storeSlug
            AND p.store.status = cl.marketprime.store.StoreStatus.ACTIVE
            AND LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%'))
            """)
    Page<Product> searchByNameAndStoreSlug(
            @Param("status") ProductStatus status,
            @Param("query") String query,
            @Param("storeSlug") String storeSlug,
            Pageable pageable);

    @Query("""
            SELECT p FROM Product p
            WHERE p.status = :status
            AND p.store.slug = :storeSlug
            AND p.store.status = cl.marketprime.store.StoreStatus.ACTIVE
            AND p.category.id = :categoryId
            """)
    Page<Product> findAllByStatusAndCategoryIdAndStoreSlug(
            @Param("status") ProductStatus status,
            @Param("categoryId") UUID categoryId,
            @Param("storeSlug") String storeSlug,
            Pageable pageable);

    @Query("""
            SELECT p FROM Product p
            WHERE p.status = :status
            AND p.store.slug = :storeSlug
            AND p.store.status = cl.marketprime.store.StoreStatus.ACTIVE
            AND p.category.id IN :categoryIds
            """)
    Page<Product> findAllByStatusAndCategoryIdInAndStoreSlug(
            @Param("status") ProductStatus status,
            @Param("categoryIds") java.util.Collection<UUID> categoryIds,
            @Param("storeSlug") String storeSlug,
            Pageable pageable);

    // Obtener todos los productos activos de tiendas activas
    @Query("""
            SELECT p FROM Product p
            WHERE p.status = :status
            AND p.store.status = cl.marketprime.store.StoreStatus.ACTIVE
            """)
    Page<Product> findAllByStatusAndStoreStatusActive(
            @Param("status") ProductStatus status,
            Pageable pageable);

    // Verificar ownership — el seller solo edita sus productos
    @Query("""
            SELECT COUNT(p) > 0 FROM Product p
            WHERE p.id = :productId
            AND p.store.user.email = :email
            AND p.status != :excluded
            """)
    boolean existsByIdAndStoreOwnerEmailAndStatusNot(
            @Param("productId") UUID productId,
            @Param("email") String email,
            @Param("excluded") ProductStatus excluded);

    // ProductRepository.java — agregar este metodo
    @Query("""
        SELECT p FROM Product p
        JOIN FETCH p.store s
        JOIN FETCH s.user u
        JOIN FETCH p.category c
        LEFT JOIN FETCH p.images
        WHERE p.id = :productId
        AND u.email = :email
        AND p.status != :excluded
        """)
    Optional<Product> findByIdAndStoreOwnerEmailAndStatusNot(
            @Param("productId") UUID productId,
            @Param("email") String email,
            @Param("excluded") ProductStatus excluded);

    @Query("""
        SELECT p FROM Product p
        JOIN FETCH p.store
        JOIN FETCH p.category
        LEFT JOIN FETCH p.images
        WHERE p.slug = :slug
        """)
    Optional<Product> findBySlugWithDetails(@Param("slug") String slug);
}