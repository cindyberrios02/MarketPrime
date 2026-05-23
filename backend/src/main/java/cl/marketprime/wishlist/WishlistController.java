// wishlist/WishlistController.java
package cl.marketprime.wishlist;

import cl.marketprime.shared.dto.PageResponse;
import cl.marketprime.wishlist.dto.WishlistResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/wishlist")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('BUYER', 'SELLER', 'ADMIN')")
public class WishlistController {

    private final WishlistService wishlistService;

    @GetMapping
    public List<WishlistResponse> getWishlist(@AuthenticationPrincipal UserDetails principal) {
        return wishlistService.getWishlist(principal.getUsername());
    }

    @PostMapping("/{productId}")
    @ResponseStatus(HttpStatus.CREATED)
    public WishlistResponse addToWishlist(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable UUID productId
    ) {
        return wishlistService.addToWishlist(principal.getUsername(), productId);
    }

    @DeleteMapping("/{productId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeFromWishlist(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable UUID productId
    ) {
        wishlistService.removeFromWishlist(principal.getUsername(), productId);
    }
}
