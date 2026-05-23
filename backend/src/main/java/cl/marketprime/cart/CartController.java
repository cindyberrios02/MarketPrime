// cart/CartController.java
package cl.marketprime.cart;

import cl.marketprime.cart.dto.AddToCartRequest;
import cl.marketprime.cart.dto.CartResponse;
import cl.marketprime.cart.dto.UpdateCartItemRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('BUYER', 'SELLER', 'ADMIN')")
public class CartController {

    private final CartService cartService;

    @GetMapping
    public CartResponse getCart(@AuthenticationPrincipal UserDetails principal) {
        return cartService.getCart(principal.getUsername());
    }

    @PostMapping
    public CartResponse addItem(
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody AddToCartRequest request
    ) {
        return cartService.addItem(principal.getUsername(), request);
    }

    @PatchMapping("/{productId}")
    public CartResponse updateItem(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable UUID productId,
            @Valid @RequestBody UpdateCartItemRequest request
    ) {
        return cartService.updateItem(principal.getUsername(), productId, request);
    }

    @DeleteMapping("/{productId}")
    public CartResponse removeItem(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable UUID productId
    ) {
        return cartService.removeItem(principal.getUsername(), productId);
    }

    @DeleteMapping
    public void clearCart(@AuthenticationPrincipal UserDetails principal) {
        cartService.clearCart(principal.getUsername());
    }
}
