package com.teamflow.repository;

import com.teamflow.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByReviewerId(Long reviewerId);
    List<Review> findByDeveloperId(Long developerId);
    List<Review> findByTaskId(Long taskId);
}
