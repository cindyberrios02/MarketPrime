// store/AdminStoreController.java
package cl.marketprime.store;

import cl.marketprime.store.dto.StoreResponse;
import cl.marketprime.shared.dto.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin/stores")
@PreAuthorize("hasRole('ADMIN')")   // aplica a todos los métodos
@RequiredArgsConstructor
public class AdminStoreController {

    private final StoreService storeService;

    @GetMapping
    public PageResponse<StoreResponse> listStores(
            @RequestParam(defaultValue = "PENDING") StoreStatus status,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable
    ) {
        return PageResponse.of(storeService.listStoresByStatus(status, pageable));
    }

    @PostMapping("/{id}/approve")
    public StoreResponse approveStore(@PathVariable UUID id) {
        return storeService.approveStore(id);
    }

    @PostMapping("/{id}/suspend")
    public StoreResponse suspendStore(@PathVariable UUID id) {
        return storeService.suspendStore(id);
    }

    @PatchMapping("/{id}/commission")
    public StoreResponse updateCommission(
            @PathVariable UUID id,
            @RequestParam java.math.BigDecimal rate
    ) {
        return storeService.updateCommission(id, rate);
    }
}