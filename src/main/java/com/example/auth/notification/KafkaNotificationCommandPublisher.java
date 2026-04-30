package com.example.auth.notification;

import com.example.auth.notification.contract.NotificationCommand;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Component;

import java.util.concurrent.CompletableFuture;

@Component
@ConditionalOnProperty(name = "app.kafka.notifications.enabled", havingValue = "true")
public class KafkaNotificationCommandPublisher implements NotificationCommandPublisher {

    private static final Logger log = LoggerFactory.getLogger(KafkaNotificationCommandPublisher.class);

    private final KafkaTemplate<String, NotificationCommand> kafkaTemplate;
    private final String commandTopic;

    public KafkaNotificationCommandPublisher(
            KafkaTemplate<String, NotificationCommand> kafkaTemplate,
            @Value("${app.kafka.notifications.command-topic}") String commandTopic
    ) {
        this.kafkaTemplate = kafkaTemplate;
        this.commandTopic = commandTopic;
    }

    @Override
    public void publish(NotificationCommand command) {
        String key = String.valueOf(command.recipientId());

        try {
            CompletableFuture<SendResult<String, NotificationCommand>> future =
                    kafkaTemplate.send(commandTopic, key, command);

            future.whenComplete((result, exception) -> {
                if (exception != null) {
                    log.warn("Failed to publish notification command. eventId={}, recipientId={}, topic={}",
                            command.eventId(), command.recipientId(), commandTopic, exception);
                    return;
                }

                log.debug("Published notification command. eventId={}, recipientId={}, topic={}, partition={}, offset={}",
                        command.eventId(),
                        command.recipientId(),
                        commandTopic,
                        result.getRecordMetadata().partition(),
                        result.getRecordMetadata().offset());
            });
        } catch (Exception e) {
            log.warn("Failed to enqueue notification command publish. eventId={}, recipientId={}, topic={}",
                    command.eventId(), command.recipientId(), commandTopic, e);
        }
    }
}
