// store/StoreService.java
package cl.marketprime.store;

import cl.marketprime.role.RoleName;
import cl.marketprime.role.RoleRepository;
import cl.marketprime.shared.exception.ConflictException;
import cl.marketprime.shared.exception.ForbiddenException;
import cl.marketprime.shared.exception.NotFoundException;
import cl.marketprime.shared.util.SlugUtils;
import cl.marketprime.store.dto.*;
import cl.marketprime.user.User;
import cl.marketprime.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StoreService {

    private final StoreProfileRepository storeRepository;
    private final UserRepository         userRepository;
    private final RoleRepository         roleRepository;
    private final cl.marketprime.review.ReviewRepository reviewRepository;
    private final cl.marketprime.order.OrderRepository   orderRepository;

    // ─── Seller endpoints ────────────────────────────────────────────────────

    @Transactional
    public StoreResponse createStore(String requesterEmail, CreateStoreRequest request) {
        User user = findUserByEmail(requesterEmail);

        if (storeRepository.existsByUserId(user.getId())) {
            throw new ConflictException("You already have a store registered.");
        }

        String slug = resolveUniqueSlug(request.slug());

        StoreProfile store = StoreProfile.builder()
                .user(user)
                .storeName(request.storeName())
                .slug(slug)
                .description(request.description())
                .build();

        return toStoreResponse(storeRepository.save(store));
    }

    @Transactional
    public StoreResponse updateMyStore(String requesterEmail, UpdateStoreRequest request) {
        StoreProfile store = findActiveStoreByEmail(requesterEmail);

        if (request.storeName() != null)  store.setStoreName(request.storeName());
        if (request.description() != null) store.setDescription(request.description());
        if (request.logoUrl() != null)     store.setLogoUrl(request.logoUrl());
        if (request.bannerUrl() != null)   store.setBannerUrl(request.bannerUrl());

        return toStoreResponse(storeRepository.save(store));
    }

    @Transactional(readOnly = true)
    public StoreResponse getMyStore(String requesterEmail) {
        User user = findUserByEmail(requesterEmail);
        StoreProfile store = storeRepository.findByUserId(user.getId())
                .orElseThrow(() -> new NotFoundException("You don't have a store yet."));
        return toStoreResponse(store);
    }

    // ─── Public endpoints ─────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public StoreSummaryResponse getPublicStore(String slug) {
        StoreProfile store = storeRepository.findBySlug(slug)
                .filter(s -> s.getStatus() == StoreStatus.ACTIVE)
                .orElseThrow(() -> new NotFoundException("Store not found: " + slug));
        return toStoreSummary(store);
    }

    @Transactional(readOnly = true)
    public StorePublicProfileResponse getStorePublicProfile(String slug) {
        StoreProfile store = storeRepository.findBySlug(slug)
                .filter(s -> s.getStatus() == StoreStatus.ACTIVE)
                .orElseThrow(() -> new NotFoundException("Store not found: " + slug));

        // Fetch reviews
        java.util.List<cl.marketprime.review.Review> reviews = reviewRepository.findAllByStoreId(store.getId());

        // Calculate average rating
        double avgRating = reviews.stream()
                .mapToInt(cl.marketprime.review.Review::getRating)
                .average()
                .orElse(5.0); // Default to 5.0 stars if no reviews yet

        avgRating = Math.round(avgRating * 10.0) / 10.0;

        // Fetch total sales
        long totalSales = orderRepository.countByStoreIdAndStatusIn(store.getId(), java.util.List.of(
                cl.marketprime.order.OrderStatus.CONFIRMED,
                cl.marketprime.order.OrderStatus.SHIPPED,
                cl.marketprime.order.OrderStatus.DELIVERED
        ));

        // Delivery stats (simulate/calculate)
        double onTimeDeliveryRate = 97.5; // Premium standard simulation
        String satisfactionLevel = "Excelente vendedor, 100% confiable y veloz";
        if (avgRating < 4.0) {
            satisfactionLevel = "Vendedor con buena reputación en sus despachos";
            onTimeDeliveryRate = 92.0;
        }
        if (avgRating < 3.0) {
            satisfactionLevel = "Vendedor regular";
            onTimeDeliveryRate = 85.0;
        }

        // Map reviews to DTO list
        java.util.List<StorePublicProfileResponse.StoreReviewResponse> reviewResponses = reviews.stream()
                .map(r -> new StorePublicProfileResponse.StoreReviewResponse(
                        r.getId(),
                        r.getUser().getFirstName() + " " + r.getUser().getLastName().substring(0, 1) + ".",
                        r.getProduct().getName(),
                        r.getProduct().getSlug(),
                        r.getRating(),
                        r.getComment(),
                        r.getCreatedAt()
                ))
                .toList();

        return new StorePublicProfileResponse(
                store.getId(),
                store.getStoreName(),
                store.getSlug(),
                store.getDescription(),
                store.getLogoUrl(),
                store.getBannerUrl(),
                avgRating,
                totalSales,
                onTimeDeliveryRate,
                satisfactionLevel,
                reviewResponses,
                store.getCreatedAt()
        );
    }

    // ─── Admin endpoints ──────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<StoreResponse> listStoresByStatus(StoreStatus status, Pageable pageable) {
        return storeRepository.findAllByStatus(status, pageable)
                .map(this::toStoreResponse);
    }

    @Transactional
    public StoreResponse approveStore(UUID storeId) {
        StoreProfile store = findStoreById(storeId);

        if (store.getStatus() == StoreStatus.ACTIVE) {
            throw new ConflictException("Store is already active.");
        }

        store.setStatus(StoreStatus.ACTIVE);
        store.setApprovedAt(Instant.now());

        // Asignar rol SELLER al dueño
        User owner = store.getUser();
        roleRepository.findByName(RoleName.ROLE_SELLER).ifPresent(role -> {
            owner.getRoles().add(role);
            userRepository.save(owner);
        });

        return toStoreResponse(storeRepository.save(store));
    }

    @Transactional
    public StoreResponse suspendStore(UUID storeId) {
        StoreProfile store = findStoreById(storeId);
        store.setStatus(StoreStatus.SUSPENDED);
        return toStoreResponse(storeRepository.save(store));
    }

    @Transactional
    public StoreResponse updateCommission(UUID storeId, BigDecimal rate) {
        if (rate == null || rate.compareTo(BigDecimal.ZERO) < 0 || rate.compareTo(new BigDecimal("100")) > 0) {
            throw new IllegalArgumentException("La comisión debe estar entre 0 y 100");
        }
        StoreProfile store = findStoreById(storeId);
        store.setCommissionRate(rate);
        return toStoreResponse(storeRepository.save(store));
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }

    private StoreProfile findStoreById(UUID id) {
        return storeRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Store not found: " + id));
    }

    private StoreProfile findActiveStoreByEmail(String email) {
        User user = findUserByEmail(email);
        StoreProfile store = storeRepository.findByUserId(user.getId())
                .orElseThrow(() -> new NotFoundException("You don't have a store."));
        if (store.getStatus() != StoreStatus.ACTIVE) {
            throw new ForbiddenException("Your store is not active yet.");
        }
        return store;
    }

    private String resolveUniqueSlug(String requestedSlug) {
        String base = SlugUtils.toSlug(requestedSlug);
        if (!storeRepository.existsBySlug(base)) return base;

        // Si ya existe, agrega sufijo numérico: mi-tienda-2, mi-tienda-3...
        int counter = 2;
        String candidate;
        do {
            candidate = base + "-" + counter++;
        } while (storeRepository.existsBySlug(candidate));
        return candidate;
    }

    private StoreResponse toStoreResponse(StoreProfile s) {
        return new StoreResponse(
                s.getId(),
                s.getStoreName(),
                s.getSlug(),
                s.getDescription(),
                s.getLogoUrl(),
                s.getBannerUrl(),
                s.getStatus(),
                s.getCommissionRate(),
                s.getUser().getEmail(),
                s.getUser().getFirstName(),
                s.getCreatedAt(),
                s.getApprovedAt()
        );
    }

    private StoreSummaryResponse toStoreSummary(StoreProfile s) {
        return new StoreSummaryResponse(
                s.getId(),
                s.getStoreName(),
                s.getSlug(),
                s.getLogoUrl(),
                s.getDescription()
        );
    }
}