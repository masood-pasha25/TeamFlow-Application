package com.teamflow.controller;

import com.teamflow.model.Review;
import com.teamflow.service.ReviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
@CrossOrigin(origins = "*")
public class ReviewController {

    @Autowired
    private ReviewService reviewService;

    @GetMapping
    public List<Review> getAllReviews() {
        return reviewService.getAllReviews();
    }

    @PostMapping("/submit")
    public ResponseEntity<?> submitForReview(@RequestBody Map<String, Long> request) {
        try {
            Long taskId = request.get("taskId");
            Long developerId = request.get("developerId");
            Long reviewerId = request.get("reviewerId");

            if (taskId == null || developerId == null || reviewerId == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "taskId, developerId, and reviewerId are required."));
            }

            Review review = reviewService.submitForReview(taskId, developerId, reviewerId);
            return ResponseEntity.ok(review);
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<?> approveReview(@PathVariable Long id, @RequestBody(required = false) Map<String, String> body) {
        try {
            String feedback = body != null ? body.get("feedback") : "Approved";
            Review review = reviewService.approveReview(id, feedback);
            return ResponseEntity.ok(review);
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<?> rejectReview(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            String feedback = body != null ? body.get("feedback") : "Needs changes";
            Review review = reviewService.rejectReview(id, feedback);
            return ResponseEntity.ok(review);
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/unavailable")
    public ResponseEntity<?> handleReviewerUnavailable(@PathVariable Long id) {
        try {
            Review review = reviewService.handleReviewerUnavailable(id);
            return ResponseEntity.ok(review);
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
