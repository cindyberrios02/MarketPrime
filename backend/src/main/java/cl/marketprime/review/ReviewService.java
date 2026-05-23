// review/ReviewService.java
package cl.marketprime.review;

import cl.marketprime.order.OrderRepository;
import cl.marketprime.product.Product;
import cl.marketprime.product.ProductRepository;
import cl.marketprime.review.dto.CreateReviewRequest;
import cl.marketprime.review.dto.ReviewResponse;
import cl.marketprime.shared.exception.ConflictException;
import cl.marketprime.shared.exception.ForbiddenException;
import cl.marketprime.shared.exception.NotFoundException;
import cl.marketprime.user.User;
import cl.marketprime.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository  reviewRepository;
    private final ProductRepository productRepository;
    private final UserRepository    userRepository;
    private final OrderRepository   orderRepository;

    // ─── Crear reseña ─────────────────────────────────────────────────────────

    @Transactional
    public ReviewResponse createReview(String email, String slug, CreateReviewRequest request) {
        User user = findUser(email);
        Product product = productRepository.findBySlug(slug)
                .orElseThrow(() -> new NotFoundException("Product not found with slug: " + slug));

        // 1. Validar que no haya reseñado previamente este producto
        if (reviewRepository.existsByProductIdAndUserId(product.getId(), user.getId())) {
            throw new ConflictException("You have already reviewed this product");
        }

        // 2. Validar que haya comprado el producto anteriormente
        boolean purchased = orderRepository.existsByUserIdAndProductIdAndPurchased(user.getId(), product.getId());
        if (!purchased) {
            throw new ForbiddenException("You can only review products that you have successfully purchased");
        }

        Review review = Review.builder()
                .user(user)
                .product(product)
                .rating(request.rating())
                .comment(request.comment())
                .build();

        return toResponse(reviewRepository.save(review));
    }

    // ─── Listar reseñas de un producto ────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<ReviewResponse> getReviewsForProduct(String slug, Pageable pageable) {
        Product product = productRepository.findBySlug(slug)
                .orElseThrow(() -> new NotFoundException("Product not found with slug: " + slug));

        return reviewRepository.findAllByProductId(product.getId(), pageable)
                .map(this::toResponse);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }

    private ReviewResponse toResponse(Review r) {
        return new ReviewResponse(
                r.getId(),
                r.getProduct().getId(),
                r.getUser().getId(),
                r.getUser().getFirstName(),
                r.getUser().getLastName(),
                r.getRating(),
                r.getComment(),
                r.getCreatedAt()
        );
    }
}
