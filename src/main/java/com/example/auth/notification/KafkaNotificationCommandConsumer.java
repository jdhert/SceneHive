package com.example.auth.notification;

import com.example.auth.notification.contract.NotificationCommand;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "app.kafka.notifications.enabled", havingValue = "true")
public class KafkaNotificationCommandConsumer {

    private static final Logger log = LoggerFactory.getLogger(KafkaNotificationCommandConsumer.class);

    private final NotificationCommandHandler notificationCommandHandler;

    public KafkaNotificationCommandConsumer(NotificationCommandHandler notificationCommandHandler) {
        this.notificationCommandHandler = notificationCommandHandler;
    }

    @KafkaListener(
            topics = "${app.kafka.notifications.command-topic}",
            groupId = "${app.kafka.notifications.consumer-group-id}"
    )
    public void consume(@Payload NotificationCommand command) {
        log.debug("Consuming notification command. eventId={}, recipientId={}, workspaceId={}, type={}",
                command.eventId(),
                command.recipientId(),
                command.workspaceId(),
                command.type());

        notificationCommandHandler.handle(command);
    }
}
