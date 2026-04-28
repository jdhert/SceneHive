package com.example.auth.notification;

import com.example.auth.notification.contract.NotificationCommand;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

@Component
public class SpringNotificationCommandPublisher implements NotificationCommandPublisher {

    private final ApplicationEventPublisher eventPublisher;

    public SpringNotificationCommandPublisher(ApplicationEventPublisher eventPublisher) {
        this.eventPublisher = eventPublisher;
    }

    @Override
    public void publish(NotificationCommand command) {
        eventPublisher.publishEvent(command);
    }
}
