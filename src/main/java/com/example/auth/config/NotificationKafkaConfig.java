package com.example.auth.config;

import org.apache.kafka.common.TopicPartition;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.kafka.core.KafkaOperations;
import org.springframework.kafka.listener.CommonErrorHandler;
import org.springframework.kafka.listener.DeadLetterPublishingRecoverer;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.util.backoff.FixedBackOff;

@EnableKafka
@Configuration
@ConditionalOnProperty(name = "app.kafka.notifications.enabled", havingValue = "true")
public class NotificationKafkaConfig {

    @Bean
    public CommonErrorHandler notificationKafkaErrorHandler(
            KafkaOperations<Object, Object> kafkaOperations,
            @Value("${app.kafka.notifications.dlq-topic}") String dlqTopic
    ) {
        DeadLetterPublishingRecoverer recoverer = new DeadLetterPublishingRecoverer(
                kafkaOperations,
                (record, exception) -> new TopicPartition(dlqTopic, record.partition())
        );

        return new DefaultErrorHandler(recoverer, new FixedBackOff(1_000L, 2L));
    }
}
