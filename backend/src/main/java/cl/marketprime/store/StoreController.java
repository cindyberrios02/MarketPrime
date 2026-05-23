// store/StoreController.java
package cl.marketprime.store;

import cl.marketprime.store.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/stores")
@RequiredArgsConstructor
public class StoreController {

    private final StoreService storeService;

    // Cualquier usuario autenticado puede solicitar crear una tienda
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("isAuthenticated()")
    public StoreResponse createStore(
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody CreateStoreRequest request
    ) {
        return storeService.createStore(principal.getUsername(), request);
    }

    // Solo el seller dueño puede actualizar su tienda
    @PatchMapping("/me")
    @PreAuthorize("hasRole('SELLER')")
    public StoreResponse updateMyStore(
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody UpdateStoreRequest request
    ) {
        return storeService.updateMyStore(principal.getUsername(), request);
    }

    // El seller ve su propia tienda (incluyendo estado PENDING)
    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public StoreResponse getMyStore(
            @AuthenticationPrincipal UserDetails principal
    ) {
        return storeService.getMyStore(principal.getUsername());
    }

    // Ruta pública — ver tienda por slug
    @GetMapping("/{slug}")
    public StoreSummaryResponse getPublicStore(@PathVariable String slug) {
        return storeService.getPublicStore(slug);
    }

    // Ruta pública detallada de reputación y perfil — ver tienda por slug
    @GetMapping("/public/{slug}")
    public StorePublicProfileResponse getStorePublicProfile(@PathVariable String slug) {
        return storeService.getStorePublicProfile(slug);
    }
}