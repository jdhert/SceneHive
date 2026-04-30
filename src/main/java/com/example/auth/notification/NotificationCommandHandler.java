package com.example.auth.notification;

import com.example.auth.dto.notification.CreateNotificationRequest;
import com.example.auth.entity.NotificationType;
import com.example.auth.notification.contract.NotificationCommand;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class NotificationCommandHandler {

    private final NotificationPublisher notificationPublisher;

    public NotificationCommandHandler(NotificationPublisher notificationPublisher) {
        this.notificationPublisher = notificationPublisher;
    }

    @EventListener
    public void handle(NotificationCommand command) {
        notificationPublisher.publish(toCreateRequest(command));
    }

    private CreateNotificationRequest toCreateRequest(NotificationCommand command) {
        return new CreateNotificationRequest(
                command.recipientId(),
                command.senderId(),
                command.workspaceId(),
                NotificationType.valueOf(command.type().name()),
                command.title(),
                command.message(),
                command.relatedUrl(),
                command.eventId()
        );
    }
}
