// product/ProductController.java
package cl.marketprime.product;

import cl.marketprime.product.dto.*;
import cl.marketprime.shared.dto.PageResponse;
import cl.marketprime.shared.service.StorageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;
    private final StorageService storageService;

    // ─── Seller endpoints ─────────────────────────────────────────────────────

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('SELLER')")
    public ProductResponse createProduct(
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody CreateProductRequest request
    ) {
        return productService.createProduct(principal.getUsername(), request);
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('SELLER')")
    public ProductResponse updateProduct(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateProductRequest request
    ) {
        return productService.updateProduct(principal.getUsername(), id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('SELLER')")
    public void deleteProduct(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable UUID id
    ) {
        productService.deleteProduct(principal.getUsername(), id);
    }

    @GetMapping("/mine")
    @PreAuthorize("hasRole('SELLER')")
    public PageResponse<ProductSummaryResponse> getMyProducts(   // ← Page → PageResponse
                                                                 @AuthenticationPrincipal UserDetails principal,
                                                                 @PageableDefault(size = 20, sort = "createdAt") Pageable pageable
    ) {
        return PageResponse.of(productService.getMyProducts(principal.getUsername(), pageable));
    }

    @GetMapping("/mine/{id}")
    @PreAuthorize("hasRole('SELLER')")
    public ProductResponse getMyProduct(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable UUID id
    ) {
        return productService.getMyProduct(principal.getUsername(), id);
    }

    @PostMapping("/{id}/images")
    @PreAuthorize("hasRole('SELLER')")
    public ProductResponse addImage(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable UUID id,
            @RequestParam String url,
            @RequestParam(required = false) String altText,
            @RequestParam(defaultValue = "false") boolean primary
    ) {
        return productService.addImage(principal.getUsername(), id, url, altText, primary);
    }

    @PostMapping(value = "/{id}/images/upload", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('SELLER')")
    public ProductResponse uploadImage(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable UUID id,
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file,
            @RequestParam(required = false) String altText,
            @RequestParam(defaultValue = "false") boolean primary
    ) {
        String imageUrl = storageService.storeFile(file);
        return productService.addImage(principal.getUsername(), id, imageUrl, altText, primary);
    }

    @DeleteMapping("/{id}/images/{imageId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('SELLER')")
    public void deleteImage(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable UUID id,
            @PathVariable UUID imageId
    ) {
        productService.deleteImage(principal.getUsername(), id, imageId);
    }

    // ─── Public endpoints ─────────────────────────────────────────────────────

    @GetMapping("/{slug}")
    public ProductResponse getProductBySlug(@PathVariable String slug) {
        return productService.getProductBySlug(slug);
    }

    private Pageable mapPageableSort(Pageable pageable) {
        if (pageable == null || pageable.getSort().isUnsorted()) {
            return pageable;
        }
        java.util.List<org.springframework.data.domain.Sort.Order> mappedOrders = new java.util.ArrayList<>();
        for (org.springframework.data.domain.Sort.Order order : pageable.getSort()) {
            if ("price".equals(order.getProperty())) {
                mappedOrders.add(new org.springframework.data.domain.Sort.Order(order.getDirection(), "basePrice"));
            } else {
                mappedOrders.add(order);
            }
        }
        return org.springframework.data.domain.PageRequest.of(
                pageable.getPageNumber(),
                pageable.getPageSize(),
                org.springframework.data.domain.Sort.by(mappedOrders)
        );
    }

    @GetMapping
    public PageResponse<ProductSummaryResponse> search(   // ← Page → PageResponse
                                                          @RequestParam(required = false) String q,
                                                          @RequestParam(required = false) UUID categoryId,
                                                          @RequestParam(required = false) String category,
                                                          @RequestParam(required = false) String storeSlug,
                                                          @PageableDefault(size = 20, sort = "createdAt") Pageable pageable
    ) {
        Pageable resolvedPageable = mapPageableSort(pageable);
        if (q != null && !q.isBlank())          return PageResponse.of(productService.search(q, storeSlug, resolvedPageable));
        if (categoryId != null) return PageResponse.of(productService.browseByCategory(categoryId, storeSlug, resolvedPageable));
        if (category != null && !category.isBlank())   return PageResponse.of(productService.browseByCategorySlug(category, storeSlug, resolvedPageable));
        if (storeSlug != null && !storeSlug.isBlank())  return PageResponse.of(productService.browseByStore(storeSlug, resolvedPageable));
        return PageResponse.of(productService.browseAll(resolvedPageable));
    }
}