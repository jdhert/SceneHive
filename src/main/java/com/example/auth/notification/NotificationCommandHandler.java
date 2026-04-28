package com.example.auth.notification;

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
        notificationPublisher.publish(command.toRequest());
    }
}
