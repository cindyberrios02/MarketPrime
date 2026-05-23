// wishlist/WishlistService.java
package cl.marketprime.wishlist;

import cl.marketprime.product.Product;
import cl.marketprime.product.ProductRepository;
import cl.marketprime.shared.exception.NotFoundException;
import cl.marketprime.user.User;
import cl.marketprime.user.UserRepository;
import cl.marketprime.wishlist.dto.WishlistResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WishlistService {

    private final WishlistRepository wishlistRepository;
    private final ProductRepository  productRepository;
    private final UserRepository     userRepository;

    // ─── Agregar a favoritos ──────────────────────────────────────────────────

    @Transactional
    public WishlistResponse addToWishlist(String email, UUID productId) {
        User    user    = findUser(email);
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new NotFoundException("Product not found"));

        WishlistItem item = wishlistRepository.findByUserIdAndProductId(user.getId(), product.getId())
                .orElseGet(() -> wishlistRepository.save(
                        WishlistItem.builder()
                                .user(user)
                                .product(product)
                                .build()
                ));

        return toResponse(item);
    }

    // ─── Quitar de favoritos ──────────────────────────────────────────────────

    @Transactional
    public void removeFromWishlist(String email, UUID productId) {
        User user = findUser(email);
        WishlistItem item = wishlistRepository.findByUserIdAndProductId(user.getId(), productId)
                .orElseThrow(() -> new NotFoundException("Product not found in your wishlist"));

        wishlistRepository.delete(item);
    }

    // ─── Listar favoritos ─────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<WishlistResponse> getWishlist(String email) {
        User user = findUser(email);
        return wishlistRepository.findAllByUserIdOrderByAddedAtDesc(user.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }

    private WishlistResponse toResponse(WishlistItem item) {
        Product    product = item.getProduct();
        BigDecimal price   = product.getSalePrice() != null ? product.getSalePrice() : product.getBasePrice();

        String imageUrl = product.getImages().stream()
                .filter(cl.marketprime.product.ProductImage::isPrimary)
                .map(cl.marketprime.product.ProductImage::getUrl)
                .findFirst()
                .orElseGet(() -> product.getImages().stream()
                        .map(cl.marketprime.product.ProductImage::getUrl)
                        .findFirst()
                        .orElse(null));

        boolean inStock = product.getStockQuantity() > 0;

        return new WishlistResponse(
                item.getId(),
                product.getId(),
                product.getName(),
                product.getSlug(),
                imageUrl,
                price,
                inStock,
                item.getAddedAt(),
                product.getName(),
                product.getSlug(),
                price
        );
    }
}
