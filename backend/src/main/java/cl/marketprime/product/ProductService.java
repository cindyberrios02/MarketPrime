// product/ProductService.java
package cl.marketprime.product;

import cl.marketprime.category.Category;
import cl.marketprime.category.CategoryRepository;
import cl.marketprime.product.dto.*;
import cl.marketprime.shared.exception.ConflictException;
import cl.marketprime.shared.exception.ForbiddenException;
import cl.marketprime.shared.exception.NotFoundException;
import cl.marketprime.shared.util.SlugUtils;
import cl.marketprime.store.StoreProfile;
import cl.marketprime.store.StoreProfileRepository;
import cl.marketprime.store.StoreStatus;
import cl.marketprime.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository      productRepository;
    private final ProductImageRepository imageRepository;
    private final StoreProfileRepository storeRepository;
    private final CategoryRepository     categoryRepository;
    private final UserRepository         userRepository;
    private final cl.marketprime.review.ReviewRepository reviewRepository;

    // ─── Seller: CRUD ─────────────────────────────────────────────────────────

    @Transactional
    public ProductResponse createProduct(String sellerEmail, CreateProductRequest request) {
        StoreProfile store = findActiveStoreByEmail(sellerEmail);
        Category category  = findCategoryById(request.categoryId());

        validateSalePrice(request.basePrice(), request.salePrice());

        String slug = resolveUniqueSlug(request.slug());

        Product product = Product.builder()
                .store(store)
                .category(category)
                .name(request.name())
                .slug(slug)
                .description(request.description())
                .basePrice(request.basePrice())
                .salePrice(request.salePrice())
                .stockQuantity(request.stockQuantity())
                .status(ProductStatus.ACTIVE)
                .build();

        return toProductResponse(productRepository.save(product));
    }

    @Transactional
    public ProductResponse updateProduct(String sellerEmail, UUID productId, UpdateProductRequest request) {
        Product product = findOwnedProduct(sellerEmail, productId);

        if (request.name() != null)          product.setName(request.name());
        if (request.description() != null)   product.setDescription(request.description());
        if (request.stockQuantity() != null) product.setStockQuantity(request.stockQuantity());

        if (request.basePrice() != null) {
            validateSalePrice(request.basePrice(), request.salePrice() != null
                    ? request.salePrice() : product.getSalePrice());
            product.setBasePrice(request.basePrice());
        }
        if (request.salePrice() != null) {
            validateSalePrice(product.getBasePrice(), request.salePrice());
            product.setSalePrice(request.salePrice());
        }
        if (request.categoryId() != null) {
            product.setCategory(findCategoryById(request.categoryId()));
        }
        if (request.status() != null) {
            ProductStatus newStatus = parseStatus(request.status());
            // El seller no puede marcar como DELETED desde este endpoint
            if (newStatus == ProductStatus.DELETED) {
                throw new IllegalArgumentException("Use the delete endpoint to remove a product.");
            }
            product.setStatus(newStatus);
        }

        return toProductResponse(productRepository.save(product));
    }

    @Transactional
    public void deleteProduct(String sellerEmail, UUID productId) {
        Product product = findOwnedProduct(sellerEmail, productId);
        product.setStatus(ProductStatus.DELETED);  // soft delete
        productRepository.save(product);
    }

    @Transactional(readOnly = true)
    public Page<ProductSummaryResponse> getMyProducts(String sellerEmail, Pageable pageable) {
        StoreProfile store = findActiveStoreByEmail(sellerEmail);
        return productRepository
                .findAllByStoreIdAndStatusNot(store.getId(), ProductStatus.DELETED, pageable)
                .map(this::toProductSummary);
    }

    @Transactional(readOnly = true)
    public ProductResponse getMyProduct(String sellerEmail, UUID productId) {
        return toProductResponse(findOwnedProduct(sellerEmail, productId));
    }

    // ─── Seller: imágenes ─────────────────────────────────────────────────────

    @Transactional
    public ProductResponse addImage(String sellerEmail, UUID productId, String url,
                                    String altText, boolean makePrimary) {
        Product product = findOwnedProduct(sellerEmail, productId);

        if (product.getImages().size() >= 5) {
            throw new IllegalArgumentException("El producto ya tiene el máximo permitido de 5 imágenes.");
        }

        if (makePrimary) {
            imageRepository.clearPrimaryByProductId(productId);
        }

        boolean isFirstImage = product.getImages().isEmpty();
        ProductImage image = ProductImage.builder()
                .product(product)
                .url(url)
                .altText(altText)
                .isPrimary(makePrimary || isFirstImage)
                .displayOrder(product.getImages().size())
                .build();

        imageRepository.save(image);
        product.getImages().add(image);
        return toProductResponse(product);
    }

    @Transactional
    public void deleteImage(String sellerEmail, UUID productId, UUID imageId) {
        findOwnedProduct(sellerEmail, productId);  // verifica ownership
        ProductImage image = imageRepository.findById(imageId)
                .orElseThrow(() -> new NotFoundException("Image not found"));
        imageRepository.delete(image);
    }

    // ─── Public: browsing ─────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public ProductResponse getProductBySlug(String slug) {
        return productRepository.findBySlug(slug)
                .filter(p -> p.getStatus() == ProductStatus.ACTIVE)
                .map(this::toProductResponse)
                .orElseThrow(() -> new NotFoundException("Product not found: " + slug));
    }

    @Transactional(readOnly = true)
    public Page<ProductSummaryResponse> browseByCategory(UUID categoryId, String storeSlug, Pageable pageable) {
        findCategoryById(categoryId);  // valida que existe
        if (storeSlug != null && !storeSlug.isBlank()) {
            return productRepository
                    .findAllByStatusAndCategoryIdAndStoreSlug(ProductStatus.ACTIVE, categoryId, storeSlug, pageable)
                    .map(this::toProductSummary);
        }
        return productRepository
                .findAllByStatusAndCategoryIdAndStoreStatusActive(ProductStatus.ACTIVE, categoryId, pageable)
                .map(this::toProductSummary);
    }

    @Transactional(readOnly = true)
    public Page<ProductSummaryResponse> browseByCategorySlug(String categorySlug, String storeSlug, Pageable pageable) {
        Category category = categoryRepository.findBySlug(categorySlug)
                .filter(Category::isActive)
                .orElseThrow(() -> new NotFoundException("Category not found: " + categorySlug));

        java.util.List<UUID> categoryIds = new java.util.ArrayList<>();
        collectCategoryIds(category, categoryIds);

        if (storeSlug != null && !storeSlug.isBlank()) {
            return productRepository
                    .findAllByStatusAndCategoryIdInAndStoreSlug(ProductStatus.ACTIVE, categoryIds, storeSlug, pageable)
                    .map(this::toProductSummary);
        }

        return productRepository
                .findAllByStatusAndCategoryIdInAndStoreStatusActive(ProductStatus.ACTIVE, categoryIds, pageable)
                .map(this::toProductSummary);
    }

    private void collectCategoryIds(Category category, java.util.List<UUID> list) {
        list.add(category.getId());
        if (category.getChildren() != null) {
            for (Category child : category.getChildren()) {
                if (child.isActive()) {
                    collectCategoryIds(child, list);
                }
            }
        }
    }

    @Transactional(readOnly = true)
    public Page<ProductSummaryResponse> browseByStore(String storeSlug, Pageable pageable) {
        StoreProfile store = storeRepository.findBySlug(storeSlug)
                .filter(s -> s.getStatus() == StoreStatus.ACTIVE)
                .orElseThrow(() -> new NotFoundException("Store not found: " + storeSlug));
        return productRepository
                .findAllByStatusAndStoreId(ProductStatus.ACTIVE, store.getId(), pageable)
                .map(this::toProductSummary);
    }

    @Transactional(readOnly = true)
    public Page<ProductSummaryResponse> search(String query, String storeSlug, Pageable pageable) {
        if (query == null || query.isBlank()) {
            return Page.empty(pageable);
        }
        if (storeSlug != null && !storeSlug.isBlank()) {
            return productRepository
                    .searchByNameAndStoreSlug(ProductStatus.ACTIVE, query.trim(), storeSlug, pageable)
                    .map(this::toProductSummary);
        }
        return productRepository
                .searchByName(ProductStatus.ACTIVE, query.trim(), pageable)
                .map(this::toProductSummary);
    }

    @Transactional(readOnly = true)
    public Page<ProductSummaryResponse> browseAll(Pageable pageable) {
        return productRepository
                .findAllByStatusAndStoreStatusActive(ProductStatus.ACTIVE, pageable)
                .map(this::toProductSummary);
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    private StoreProfile findActiveStoreByEmail(String email) {
        var user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        return storeRepository.findByUserId(user.getId())
                .filter(s -> s.getStatus() == StoreStatus.ACTIVE)
                .orElseThrow(() -> new ForbiddenException("You don't have an active store."));
    }

    private Product findOwnedProduct(String sellerEmail, UUID productId) {
        boolean owns = productRepository.existsByIdAndStoreOwnerEmailAndStatusNot(
                productId, sellerEmail, ProductStatus.DELETED);
        if (!owns) throw new NotFoundException("Product not found or access denied.");
        return productRepository.findById(productId).orElseThrow();
    }

    private Category findCategoryById(UUID id) {
        return categoryRepository.findById(id)
                .filter(Category::isActive)
                .orElseThrow(() -> new NotFoundException("Category not found: " + id));
    }

    private void validateSalePrice(BigDecimal basePrice, BigDecimal salePrice) {
        if (salePrice != null && salePrice.compareTo(basePrice) >= 0) {
            throw new IllegalArgumentException("Sale price must be lower than base price.");
        }
    }

    private ProductStatus parseStatus(String status) {
        try {
            return ProductStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid status: " + status);
        }
    }

    private String resolveUniqueSlug(String requested) {
        String base = SlugUtils.toSlug(requested);
        if (!productRepository.existsBySlug(base)) return base;
        int counter = 2;
        String candidate;
        do { candidate = base + "-" + counter++; }
        while (productRepository.existsBySlug(candidate));
        return candidate;
    }

    // ─── Mappers ──────────────────────────────────────────────────────────────

    private ProductResponse toProductResponse(Product p) {
        List<ProductImageDto> images = p.getImages().stream()
                .map(img -> new ProductImageDto(img.getId(), img.getUrl(), img.getAltText(), img.isPrimary(), img.getDisplayOrder()))
                .toList();

        String primaryImageUrl = p.getImages().stream()
                .filter(ProductImage::isPrimary)
                .map(ProductImage::getUrl)
                .findFirst()
                .orElse(null);

        BigDecimal effPrice = effectivePrice(p);

        Double avgRating = reviewRepository.getAverageRatingForProduct(p.getId());
        if (avgRating == null) {
            avgRating = 5.0;
        } else {
            avgRating = Math.round(avgRating * 10.0) / 10.0;
        }
        long revCount = reviewRepository.countByProductId(p.getId());

        return new ProductResponse(
                p.getId(), p.getName(), p.getSlug(), p.getDescription(),
                p.getBasePrice(), p.getSalePrice(), effPrice,
                p.getStockQuantity(), p.getStatus(), p.isFeatured(),
                p.getCategory().getId(), p.getCategory().getName(),
                p.getStore().getId(), p.getStore().getStoreName(), p.getStore().getSlug(),
                images, p.getCreatedAt(), p.getUpdatedAt(),
                effPrice, primaryImageUrl, p.getStockQuantity(),
                avgRating, revCount
        );
    }

    private ProductSummaryResponse toProductSummary(Product p) {
        String primaryImageUrl = p.getImages().stream()
                .filter(ProductImage::isPrimary)
                .map(ProductImage::getUrl)
                .findFirst()
                .orElse(null);

        java.util.List<String> imageUrls = p.getImages().stream()
                .map(ProductImage::getUrl)
                .toList();

        BigDecimal effPrice = effectivePrice(p);

        Double avgRating = reviewRepository.getAverageRatingForProduct(p.getId());
        if (avgRating == null) {
            avgRating = 5.0;
        } else {
            avgRating = Math.round(avgRating * 10.0) / 10.0;
        }
        long revCount = reviewRepository.countByProductId(p.getId());

        return new ProductSummaryResponse(
                p.getId(), p.getName(), p.getSlug(),
                p.getBasePrice(), p.getSalePrice(), effPrice,
                p.getStockQuantity(), p.getStatus(),
                p.getCategory().getName(),
                p.getStore().getStoreName(), p.getStore().getSlug(),
                primaryImageUrl,
                imageUrls,
                effPrice, primaryImageUrl, p.getStockQuantity(),
                avgRating, revCount
        );
    }

    private BigDecimal effectivePrice(Product p) {
        return p.getSalePrice() != null ? p.getSalePrice() : p.getBasePrice();
    }
}