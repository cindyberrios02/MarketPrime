// cart/CartService.java
package cl.marketprime.cart;

import cl.marketprime.cart.dto.AddToCartRequest;
import cl.marketprime.cart.dto.CartItemResponse;
import cl.marketprime.cart.dto.CartResponse;
import cl.marketprime.cart.dto.UpdateCartItemRequest;
import cl.marketprime.product.Product;
import cl.marketprime.product.ProductRepository;
import cl.marketprime.product.ProductStatus;
import cl.marketprime.shared.exception.NotFoundException;
import cl.marketprime.user.User;
import cl.marketprime.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartItemRepository cartItemRepository;
    private final ProductRepository  productRepository;
    private final UserRepository     userRepository;

    // ─── Ver carrito ──────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public CartResponse getCart(String email) {
        User user = findUser(email);
        List<CartItem> items = cartItemRepository.findAllByUserIdOrderByCreatedAtDesc(user.getId());
        return buildCartResponse(items);
    }

    // ─── Agregar item al carrito ──────────────────────────────────────────────

    @Transactional
    public CartResponse addItem(String email, AddToCartRequest request) {
        User    user    = findUser(email);
        Product product = productRepository.findById(request.productId())
                .orElseThrow(() -> new NotFoundException("Product not found"));

        // Validaciones de negocio:
        if (product.getStatus() != ProductStatus.ACTIVE) {
            throw new IllegalArgumentException("Product is not available for purchase");
        }
        if (product.getStockQuantity() < request.quantity()) {
            throw new IllegalArgumentException("Not enough stock available. Remaining stock: " + product.getStockQuantity());
        }

        CartItem item = cartItemRepository.findByUserIdAndProductId(user.getId(), product.getId())
                .map(existing -> {
                    int newQty = existing.getQuantity() + request.quantity();
                    if (product.getStockQuantity() < newQty) {
                        throw new IllegalArgumentException("Cannot add more. Exceeds available stock: " + product.getStockQuantity());
                    }
                    existing.setQuantity(newQty);
                    return existing;
                })
                .orElseGet(() -> CartItem.builder()
                        .user(user)
                        .product(product)
                        .quantity(request.quantity())
                        .build());

        cartItemRepository.save(item);
        return getCart(email);
    }

    // ─── Actualizar cantidad de item ──────────────────────────────────────────

    @Transactional
    public CartResponse updateItem(String email, UUID productId, UpdateCartItemRequest request) {
        User     user = findUser(email);
        CartItem item = cartItemRepository.findByUserIdAndProductId(user.getId(), productId)
                .orElseThrow(() -> new NotFoundException("Product not found in your cart"));

        Product product = item.getProduct();
        if (product.getStockQuantity() < request.quantity()) {
            throw new IllegalArgumentException("Not enough stock available. Remaining stock: " + product.getStockQuantity());
        }

        item.setQuantity(request.quantity());
        cartItemRepository.save(item);
        return getCart(email);
    }

    // ─── Eliminar item del carrito ────────────────────────────────────────────

    @Transactional
    public CartResponse removeItem(String email, UUID productId) {
        User     user = findUser(email);
        CartItem item = cartItemRepository.findByUserIdAndProductId(user.getId(), productId)
                .orElseThrow(() -> new NotFoundException("Product not found in your cart"));

        cartItemRepository.delete(item);
        return getCart(email);
    }

    // ─── Vaciar carrito completo ──────────────────────────────────────────────

    @Transactional
    public void clearCart(String email) {
        User user = findUser(email);
        cartItemRepository.deleteAllByUserId(user.getId());
    }

    // ─── Mapeos y Construcción de Respuestas ──────────────────────────────────

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }

    private CartResponse buildCartResponse(List<CartItem> items) {
        List<CartItemResponse> mappedItems = items.stream()
                .map(this::toItemResponse)
                .toList();

        int totalItems = mappedItems.stream()
                .mapToInt(CartItemResponse::quantity)
                .sum();

        BigDecimal totalAmount = mappedItems.stream()
                .map(CartItemResponse::subtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new CartResponse(mappedItems, totalItems, totalAmount);
    }

    private CartItemResponse toItemResponse(CartItem item) {
        Product    product = item.getProduct();
        BigDecimal price   = product.getSalePrice() != null ? product.getSalePrice() : product.getBasePrice();
        BigDecimal subtotal = price.multiply(BigDecimal.valueOf(item.getQuantity()));

        // Obtener la imagen principal o la primera
        String imageUrl = product.getImages().stream()
                .filter(cl.marketprime.product.ProductImage::isPrimary)
                .map(cl.marketprime.product.ProductImage::getUrl)
                .findFirst()
                .orElseGet(() -> product.getImages().stream()
                        .map(cl.marketprime.product.ProductImage::getUrl)
                        .findFirst()
                        .orElse(null));

        cl.marketprime.store.StoreProfile store = product.getStore();
        UUID storeId = store != null ? store.getId() : null;
        String storeName = store != null ? store.getStoreName() : null;
        String storeSlug = store != null ? store.getSlug() : null;

        return new CartItemResponse(
                item.getId(),
                product.getId(),
                product.getName(),
                product.getSlug(),
                imageUrl,
                price,
                item.getQuantity(),
                subtotal,
                storeId,
                storeName,
                storeSlug
        );
    }
}
