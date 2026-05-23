// category/CategoryRepository.java
package cl.marketprime.category;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CategoryRepository extends JpaRepository<Category, UUID> {

    Optional<Category> findBySlug(String slug);
    boolean existsBySlug(String slug);

    // Solo categorías raíz (sin padre), activas, ordenadas
    List<Category> findAllByParentIsNullAndIsActiveTrueOrderByDisplayOrderAsc();

    // Subcategorías de un padre específico
    List<Category> findAllByParentIdAndIsActiveTrueOrderByDisplayOrderAsc(UUID parentId);
}