// address/AddressController.java
package cl.marketprime.address;

import cl.marketprime.address.dto.AddressResponse;
import cl.marketprime.address.dto.CreateAddressRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/addresses")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('BUYER', 'SELLER', 'ADMIN')")
public class AddressController {

    private final AddressService addressService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AddressResponse create(
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody CreateAddressRequest request
    ) {
        return addressService.create(principal.getUsername(), request);
    }

    @GetMapping
    public List<AddressResponse> list(@AuthenticationPrincipal UserDetails principal) {
        return addressService.list(principal.getUsername());
    }

    @PutMapping("/{id}")
    public AddressResponse update(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable UUID id,
            @Valid @RequestBody CreateAddressRequest request
    ) {
        return addressService.update(principal.getUsername(), id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable UUID id
    ) {
        addressService.delete(principal.getUsername(), id);
    }

    @PatchMapping("/{id}/default")
    public AddressResponse setDefault(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable UUID id
    ) {
        return addressService.setDefault(principal.getUsername(), id);
    }
}
