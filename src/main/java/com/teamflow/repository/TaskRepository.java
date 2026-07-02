package com.teamflow.repository;

import com.teamflow.model.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByAssignedUserId(Long userId);

    @Query("SELECT t FROM Task t JOIN t.projects p WHERE p.id = :projectId")
    List<Task> findByProjectId(@Param("projectId") Long projectId);
}
