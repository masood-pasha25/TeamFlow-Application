package com.teamflow.service;

import com.teamflow.model.Task;
import com.teamflow.model.TaskDependency;
import com.teamflow.model.User;
import com.teamflow.repository.TaskDependencyRepository;
import com.teamflow.repository.TaskRepository;
import com.teamflow.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class TaskService {

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private TaskDependencyRepository taskDependencyRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationService notificationService;

    public List<Task> getAllTasks() {
        return taskRepository.findAll();
    }

    public Optional<Task> getTaskById(Long id) {
        return taskRepository.findById(id);
    }

    @Transactional
    public Task createTask(Task task) {
        // Evaluate initial status based on dependencies
        Task savedTask = taskRepository.save(task);
        if (task.getAssignedUser() != null) {
            notificationService.sendNotification(task.getAssignedUser(), 
                "You have been assigned to the task: '" + task.getTitle() + "'");
        }
        return savedTask;
    }

    @Transactional
    public Task updateTask(Long id, Task taskDetails) {
        Task task = taskRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Task not found with id: " + id));

        User oldAssignee = task.getAssignedUser();
        User newAssignee = taskDetails.getAssignedUser();

        task.setTitle(taskDetails.getTitle());
        task.setDescription(taskDetails.getDescription());
        task.setPriority(taskDetails.getPriority());
        task.setDueDate(taskDetails.getDueDate());
        task.setProjects(taskDetails.getProjects());
        task.setAssignedUser(newAssignee);

        // Validate state transitions with business rules
        Task.Status oldStatus = task.getStatus();
        Task.Status newStatus = taskDetails.getStatus();

        if (newStatus != oldStatus) {
            transitionTaskStatus(task, newStatus);
        } else {
            taskRepository.save(task);
        }

        // Notify new assignee if changed
        if (newAssignee != null && (oldAssignee == null || !oldAssignee.getId().equals(newAssignee.getId()))) {
            notificationService.sendNotification(newAssignee, 
                "You have been assigned to the task: '" + task.getTitle() + "'");
        }

        return task;
    }

    @Transactional
    public void transitionTaskStatus(Task task, Task.Status newStatus) {
        if (newStatus == Task.Status.IN_PROGRESS || newStatus == Task.Status.COMPLETED || newStatus == Task.Status.UNDER_REVIEW) {
            // Check dependencies
            List<TaskDependency> dependencies = taskDependencyRepository.findByTaskId(task.getId());
            for (TaskDependency dep : dependencies) {
                Task prerequisite = taskRepository.findById(dep.getDependsOnTaskId()).orElse(null);
                if (prerequisite != null && prerequisite.getStatus() != Task.Status.COMPLETED) {
                    task.setStatus(Task.Status.BLOCKED);
                    taskRepository.save(task);
                    throw new IllegalStateException("Cannot transition task '" + task.getTitle() + 
                        "'. It is blocked by incomplete dependency: '" + prerequisite.getTitle() + "'");
                }
            }
        }

        task.setStatus(newStatus);
        taskRepository.save(task);

        // Action-based notifications
        if (newStatus == Task.Status.COMPLETED) {
            // Notify managers
            List<User> managers = userRepository.findAll().stream()
                .filter(u -> u.getRole() == User.Role.MANAGER || u.getRole() == User.Role.ADMIN)
                .collect(Collectors.toList());
            for (User manager : managers) {
                notificationService.sendNotification(manager, 
                    "Task Completed: '" + task.getTitle() + "' has been marked completed.");
            }

            // Check if this unblocks other tasks
            unblockDependentTasks(task.getId());
        }
    }

    private void unblockDependentTasks(Long completedTaskId) {
        List<TaskDependency> dependents = taskDependencyRepository.findByDependsOnTaskId(completedTaskId);
        for (TaskDependency dep : dependents) {
            Task dependentTask = taskRepository.findById(dep.getTaskId()).orElse(null);
            if (dependentTask != null && dependentTask.getStatus() == Task.Status.BLOCKED) {
                // Check if all its dependencies are now completed
                boolean allCompleted = true;
                List<TaskDependency> allDeps = taskDependencyRepository.findByTaskId(dependentTask.getId());
                for (TaskDependency d : allDeps) {
                    Task prereq = taskRepository.findById(d.getDependsOnTaskId()).orElse(null);
                    if (prereq != null && prereq.getStatus() != Task.Status.COMPLETED) {
                        allCompleted = false;
                        break;
                    }
                }
                if (allCompleted) {
                    dependentTask.setStatus(Task.Status.ASSIGNED);
                    taskRepository.save(dependentTask);
                    if (dependentTask.getAssignedUser() != null) {
                        notificationService.sendNotification(dependentTask.getAssignedUser(), 
                            "Task Unblocked: '" + dependentTask.getTitle() + "' is no longer blocked and is ready to start.");
                    }
                }
            }
        }
    }

    @Transactional
    public TaskDependency addDependency(Long taskId, Long dependsOnTaskId) {
        if (taskId.equals(dependsOnTaskId)) {
            throw new IllegalArgumentException("A task cannot depend on itself.");
        }

        // Cycle detection: check if dependsOnTaskId already depends on taskId
        if (isDependentOn(dependsOnTaskId, taskId, new HashSet<>())) {
            throw new IllegalStateException("Circular dependency detected! Adding this dependency would create a loop.");
        }

        // Check if dependency already exists
        List<TaskDependency> existing = taskDependencyRepository.findByTaskId(taskId);
        for (TaskDependency dep : existing) {
            if (dep.getDependsOnTaskId().equals(dependsOnTaskId)) {
                return dep; // already exists
            }
        }

        TaskDependency dependency = new TaskDependency(taskId, dependsOnTaskId);
        TaskDependency saved = taskDependencyRepository.save(dependency);

        // If the prerequisite task is not completed, update dependent task to BLOCKED
        Task prerequisite = taskRepository.findById(dependsOnTaskId).orElse(null);
        Task dependent = taskRepository.findById(taskId).orElse(null);
        if (prerequisite != null && dependent != null && prerequisite.getStatus() != Task.Status.COMPLETED) {
            dependent.setStatus(Task.Status.BLOCKED);
            taskRepository.save(dependent);
            if (dependent.getAssignedUser() != null) {
                notificationService.sendNotification(dependent.getAssignedUser(), 
                    "Your task '" + dependent.getTitle() + "' is now BLOCKED by '" + prerequisite.getTitle() + "'");
            }
        }

        return saved;
    }

    @Transactional
    public void removeDependency(Long taskId, Long dependsOnTaskId) {
        taskDependencyRepository.deleteByTaskIdAndDependsOnTaskId(taskId, dependsOnTaskId);
        
        // Re-evaluate if the task is still blocked
        Task task = taskRepository.findById(taskId).orElse(null);
        if (task != null && task.getStatus() == Task.Status.BLOCKED) {
            boolean hasIncompletePrereq = false;
            List<TaskDependency> currentDeps = taskDependencyRepository.findByTaskId(taskId);
            for (TaskDependency dep : currentDeps) {
                Task prereq = taskRepository.findById(dep.getDependsOnTaskId()).orElse(null);
                if (prereq != null && prereq.getStatus() != Task.Status.COMPLETED) {
                    hasIncompletePrereq = true;
                    break;
                }
            }
            if (!hasIncompletePrereq) {
                task.setStatus(task.getAssignedUser() != null ? Task.Status.ASSIGNED : Task.Status.CREATED);
                taskRepository.save(task);
            }
        }
    }

    private boolean isDependentOn(Long taskId, Long candidateDependsOnId, Set<Long> visited) {
        if (taskId.equals(candidateDependsOnId)) {
            return true;
        }
        if (visited.contains(taskId)) {
            return false;
        }
        visited.add(taskId);
        List<TaskDependency> deps = taskDependencyRepository.findByTaskId(taskId);
        for (TaskDependency dep : deps) {
            if (isDependentOn(dep.getDependsOnTaskId(), candidateDependsOnId, visited)) {
                return true;
            }
        }
        return false;
    }

    @Transactional
    public void deleteTask(Long id) {
        // Delete dependencies where this task is involved
        List<TaskDependency> deps1 = taskDependencyRepository.findByTaskId(id);
        taskDependencyRepository.deleteAll(deps1);
        List<TaskDependency> deps2 = taskDependencyRepository.findByDependsOnTaskId(id);
        taskDependencyRepository.deleteAll(deps2);

        taskRepository.deleteById(id);
    }
}
