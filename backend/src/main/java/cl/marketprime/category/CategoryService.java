// category/CategoryService.java
package cl.marketprime.category;

import cl.marketprime.category.dto.CategoryResponse;
import cl.marketprime.category.dto.CreateCategoryRequest;
import cl.marketprime.shared.exception.ConflictException;
import cl.marketprime.shared.exception.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    @Transactional(readOnly = true)
    public List<CategoryResponse> getRootCategories() {
        return categoryRepository
                .findAllByParentIsNullAndIsActiveTrueOrderByDisplayOrderAsc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public CategoryResponse getCategoryBySlug(String slug) {
        Category category = categoryRepository.findBySlug(slug)
                .filter(Category::isActive)
                .orElseThrow(() -> new NotFoundException("Category not found: " + slug));
        return toResponse(category);
    }

    @Transactional
    public CategoryResponse createCategory(CreateCategoryRequest request) {
        if (categoryRepository.existsBySlug(request.slug())) {
            throw new ConflictException("Slug already exists: " + request.slug());
        }

        Category parent = null;
        if (request.parentId() != null) {
            parent = categoryRepository.findById(request.parentId())
                    .orElseThrow(() -> new NotFoundException("Parent category not found"));
        }

        Category category = Category.builder()
                .name(request.name())
                .slug(request.slug())
                .parent(parent)
                .iconUrl(request.iconUrl())
                .displayOrder(request.displayOrder() != null ? request.displayOrder() : 0)
                .build();

        return toResponse(categoryRepository.save(category));
    }

    // ─── Mapper ───────────────────────────────────────────────────────────────

    private CategoryResponse toResponse(Category c) {
        List<CategoryResponse> children = c.getChildren().stream()
                .filter(Category::isActive)
                .map(this::toResponse)
                .toList();

        return new CategoryResponse(
                c.getId(),
                c.getName(),
                c.getSlug(),
                c.getIconUrl(),
                c.getDisplayOrder(),
                children
        );
    }
}