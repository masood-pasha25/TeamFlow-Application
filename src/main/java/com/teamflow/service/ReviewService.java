package com.teamflow.service;

import com.teamflow.model.Review;
import com.teamflow.model.Task;
import com.teamflow.model.User;
import com.teamflow.repository.ReviewRepository;
import com.teamflow.repository.TaskRepository;
import com.teamflow.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ReviewService {

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TaskService taskService;

    @Autowired
    private NotificationService notificationService;

    public List<Review> getAllReviews() {
        return reviewRepository.findAll();
    }

    public Optional<Review> getReviewById(Long id) {
        return reviewRepository.findById(id);
    }

    @Transactional
    public Review submitForReview(Long taskId, Long developerId, Long reviewerId) {
        Task task = taskRepository.findById(taskId)
            .orElseThrow(() -> new IllegalArgumentException("Task not found with id: " + taskId));

        User developer = userRepository.findById(developerId)
            .orElseThrow(() -> new IllegalArgumentException("Developer not found with id: " + developerId));

        User reviewer = userRepository.findById(reviewerId)
            .orElseThrow(() -> new IllegalArgumentException("Reviewer not found with id: " + reviewerId));

        // Update task status to UNDER_REVIEW
        taskService.transitionTaskStatus(task, Task.Status.UNDER_REVIEW);

        Review review = new Review(task, developer, reviewer, Review.Status.PENDING, null);
        Review savedReview = reviewRepository.save(review);

        notificationService.sendNotification(reviewer, 
            "Task Review Requested: '" + task.getTitle() + "' submitted by " + developer.getName());

        return savedReview;
    }

    @Transactional
    public Review approveReview(Long reviewId, String feedback) {
        Review review = reviewRepository.findById(reviewId)
            .orElseThrow(() -> new IllegalArgumentException("Review not found with id: " + reviewId));

        review.setStatus(Review.Status.APPROVED);
        review.setFeedback(feedback);
        reviewRepository.save(review);

        // Transition task to COMPLETED
        taskService.transitionTaskStatus(review.getTask(), Task.Status.COMPLETED);

        // Notify developer
        notificationService.sendNotification(review.getDeveloper(), 
            "Task Approved: Your task '" + review.getTask().getTitle() + "' was approved by " + review.getReviewer().getName());

        return review;
    }

    @Transactional
    public Review rejectReview(Long reviewId, String feedback) {
        Review review = reviewRepository.findById(reviewId)
            .orElseThrow(() -> new IllegalArgumentException("Review not found with id: " + reviewId));

        review.setStatus(Review.Status.REJECTED);
        review.setFeedback(feedback);
        reviewRepository.save(review);

        // Transition task back to IN_PROGRESS
        taskService.transitionTaskStatus(review.getTask(), Task.Status.IN_PROGRESS);

        // Notify developer
        notificationService.sendNotification(review.getDeveloper(), 
            "Task Rejected: Your task '" + review.getTask().getTitle() + "' was rejected. Feedback: " + feedback);

        return review;
    }

    @Transactional
    public Review handleReviewerUnavailable(Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
            .orElseThrow(() -> new IllegalArgumentException("Review not found with id: " + reviewId));

        // Find fallback reviewer: a Manager or Admin who is not the developer or the current unavailable reviewer
        List<User> options = userRepository.findAll().stream()
            .filter(u -> (u.getRole() == User.Role.MANAGER || u.getRole() == User.Role.ADMIN))
            .filter(u -> !u.getId().equals(review.getDeveloper().getId()))
            .filter(u -> review.getReviewer() == null || !u.getId().equals(review.getReviewer().getId()))
            .collect(Collectors.toList());

        User managerToNotify = userRepository.findAll().stream()
            .filter(u -> u.getRole() == User.Role.MANAGER)
            .findFirst()
            .orElse(userRepository.findAll().stream()
                .filter(u -> u.getRole() == User.Role.ADMIN)
                .findFirst().orElse(null));

        if (!options.isEmpty()) {
            User newReviewer = options.get(0);
            User oldReviewer = review.getReviewer();
            review.setReviewer(newReviewer);
            reviewRepository.save(review);

            // Notify new reviewer
            notificationService.sendNotification(newReviewer, 
                "Assigned Reassigned Review: '" + review.getTask().getTitle() + "' originally assigned to " + 
                (oldReviewer != null ? oldReviewer.getName() : "unassigned") + " has been reassigned to you.");

            // Notify developer of reassignment
            notificationService.sendNotification(review.getDeveloper(), 
                "Reviewer Reassigned: Your task '" + review.getTask().getTitle() + "' review is reassigned to " + newReviewer.getName());

            // Notify manager
            if (managerToNotify != null) {
                notificationService.sendNotification(managerToNotify, 
                    "Reviewer Unavailable Alert: Review for task '" + review.getTask().getTitle() + "' was reassigned to " + newReviewer.getName());
            }
        } else {
            // No fallback reviewer found, notify manager to assign manually
            if (managerToNotify != null) {
                notificationService.sendNotification(managerToNotify, 
                    "Reviewer Unavailable Critical Alert: Review for task '" + review.getTask().getTitle() + 
                    "' has no automatic reviewer fallback option. Manual intervention required.");
            }
        }

        return review;
    }
}
