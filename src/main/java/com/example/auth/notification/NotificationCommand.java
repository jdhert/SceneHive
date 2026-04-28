package com.example.auth.notification;

import com.example.auth.dto.notification.CreateNotificationRequest;
import com.example.auth.entity.NotificationType;

public record NotificationCommand(
        Long recipientId,
        Long senderId,
        Long workspaceId,
        NotificationType type,
        String title,
        String message,
        String relatedUrl
) {

    public CreateNotificationRequest toRequest() {
        return new CreateNotificationRequest(
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
