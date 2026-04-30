package com.example.auth.notification;

import com.example.auth.notification.contract.NotificationCommand;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(
        name = "app.kafka.notifications.enabled",
        havingValue = "false",
        matchIfMissing = true
)
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
