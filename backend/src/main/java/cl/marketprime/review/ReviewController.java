// review/ReviewController.java
package cl.marketprime.review;

import cl.marketprime.review.dto.CreateReviewRequest;
import cl.marketprime.review.dto.ReviewResponse;
import cl.marketprime.shared.dto.PageResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/products/{slug}/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('BUYER', 'SELLER', 'ADMIN')")
    public ReviewResponse createReview(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable String slug,
            @Valid @RequestBody CreateReviewRequest request
    ) {
        return reviewService.createReview(principal.getUsername(), slug, request);
    }

    @GetMapping
    public PageResponse<ReviewResponse> getReviews(
            @PathVariable String slug,
            @PageableDefault(size = 10, sort = "createdAt") Pageable pageable
    ) {
        return PageResponse.of(reviewService.getReviewsForProduct(slug, pageable));
    }
}
