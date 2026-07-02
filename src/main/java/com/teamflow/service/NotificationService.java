package com.teamflow.service;

import com.teamflow.model.Notification;
import com.teamflow.model.Task;
import com.teamflow.model.User;
import com.teamflow.repository.NotificationRepository;
import com.teamflow.repository.TaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.List;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private TaskRepository taskRepository;

    public Notification sendNotification(User user, String message) {
        if (user == null) return null;
        Notification notification = new Notification(user, message);
        return notificationRepository.save(notification);
    }

    public List<Notification> getNotificationsForUser(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedDateDesc(userId);
    }

    public List<Notification> getUnreadNotificationsForUser(Long userId) {
        return notificationRepository.findByUserIdAndIsReadOrderByCreatedDateDesc(userId, false);
    }

    public Notification markAsRead(Long notificationId) {
        return notificationRepository.findById(notificationId).map(n -> {
            n.setIsRead(true);
            return notificationRepository.save(n);
        }).orElse(null);
    }

    // Cron expression to run every night at 12:00 AM
    @Scheduled(cron = "0 0 0 * * ?")
    public void checkDeadlinesCron() {
        checkDeadlines();
    }

    // Expose this method to be triggered manually for demo purposes
    public int checkDeadlines() {
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        List<Task> tasks = taskRepository.findAll();
        int count = 0;
        for (Task task : tasks) {
            // Task is not completed and due date is tomorrow
            if (task.getStatus() != Task.Status.COMPLETED && 
                task.getDueDate() != null && 
                task.getDueDate().equals(tomorrow)) {
                
                if (task.getAssignedUser() != null) {
                    sendNotification(task.getAssignedUser(), 
                        "Reminder: Task '" + task.getTitle() + "' is due tomorrow!");
                    count++;
                }
            }
        }
        return count;
    }
}
