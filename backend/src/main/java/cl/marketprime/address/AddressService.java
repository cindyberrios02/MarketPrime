// address/AddressService.java
package cl.marketprime.address;

import cl.marketprime.address.dto.AddressResponse;
import cl.marketprime.address.dto.CreateAddressRequest;
import cl.marketprime.shared.exception.NotFoundException;
import cl.marketprime.user.User;
import cl.marketprime.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AddressService {

    private final AddressRepository addressRepository;
    private final UserRepository    userRepository;

    // ─── Crear dirección ──────────────────────────────────────────────────────

    @Transactional
    public AddressResponse create(String email, CreateAddressRequest request) {
        User user = findUser(email);

        // Si no hay direcciones aún, la primera se vuelve default automáticamente
        boolean noAddresses = !addressRepository.existsByUserId(user.getId());
        boolean makeDefault  = Boolean.TRUE.equals(request.isDefault()) || noAddresses;

        if (makeDefault) {
            clearDefault(user.getId());
        }

        Address address = Address.builder()
                .user(user)
                .alias(request.alias())
                .recipientName(request.recipientName())
                .phone(request.phone())
                .street(request.street())
                .number(request.number())
                .apartment(request.apartment())
                .city(request.city())
                .region(request.region())
                .zipCode(request.zipCode())
                .isDefault(makeDefault)
                .build();

        return toResponse(addressRepository.save(address));
    }

    // ─── Listar direcciones del usuario ───────────────────────────────────────

    @Transactional(readOnly = true)
    public List<AddressResponse> list(String email) {
        User user = findUser(email);
        return addressRepository
                .findAllByUserIdOrderByIsDefaultDescCreatedAtDesc(user.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // ─── Actualizar dirección ─────────────────────────────────────────────────

    @Transactional
    public AddressResponse update(String email, UUID addressId, CreateAddressRequest request) {
        User    user    = findUser(email);
        Address address = findOwned(addressId, user.getId());

        boolean makeDefault = Boolean.TRUE.equals(request.isDefault());
        if (makeDefault) {
            clearDefault(user.getId());
            address.setDefault(true);
        }

        if (request.alias()         != null) address.setAlias(request.alias());
        if (request.recipientName() != null) address.setRecipientName(request.recipientName());
        if (request.phone()         != null) address.setPhone(request.phone());
        if (request.street()        != null) address.setStreet(request.street());
        if (request.number()        != null) address.setNumber(request.number());
        if (request.apartment()     != null) address.setApartment(request.apartment());
        if (request.city()          != null) address.setCity(request.city());
        if (request.region()        != null) address.setRegion(request.region());
        if (request.zipCode()       != null) address.setZipCode(request.zipCode());

        return toResponse(addressRepository.save(address));
    }

    // ─── Eliminar dirección ───────────────────────────────────────────────────

    @Transactional
    public void delete(String email, UUID addressId) {
        User    user    = findUser(email);
        Address address = findOwned(addressId, user.getId());
        addressRepository.delete(address);
    }

    // ─── Marcar como default ──────────────────────────────────────────────────

    @Transactional
    public AddressResponse setDefault(String email, UUID addressId) {
        User    user    = findUser(email);
        Address address = findOwned(addressId, user.getId());
        clearDefault(user.getId());
        address.setDefault(true);
        return toResponse(addressRepository.save(address));
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }

    private Address findOwned(UUID addressId, UUID userId) {
        return addressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new NotFoundException("Address not found"));
    }

    private void clearDefault(UUID userId) {
        addressRepository.findFirstByUserIdAndIsDefaultTrue(userId)
                .ifPresent(a -> {
                    a.setDefault(false);
                    addressRepository.save(a);
                });
    }

    private AddressResponse toResponse(Address a) {
        return new AddressResponse(
                a.getId(), a.getAlias(), a.getRecipientName(), a.getPhone(),
                a.getStreet(), a.getNumber(), a.getApartment(),
                a.getCity(), a.getRegion(), a.getZipCode(), a.getCountry(),
                a.isDefault(), a.getCreatedAt()
        );
    }
}
