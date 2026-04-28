package com.example.auth.notification.contract;

import java.time.Instant;
import java.util.UUID;

public record NotificationCommand(
        String eventId,
        int schemaVersion,
        Instant occurredAt,
        Long recipientId,
        Long senderId,
        Long workspaceId,
        NotificationCommandType type,
        String title,
        String message,
        String relatedUrl
) {

    public static final int CURRENT_SCHEMA_VERSION = 1;

    public static NotificationCommand create(
            Long recipientId,
            Long senderId,
            Long workspaceId,
            NotificationCommandType type,
            String title,
            String message,
            String relatedUrl
    ) {
        return new NotificationCommand(
                UUID.randomUUID().toString(),
                CURRENT_SCHEMA_VERSION,
                Instant.now(),
                recipientId,
                senderId,
                workspaceId,
                type,
                title,
                message,
                relatedUrl
        );
    }
}
