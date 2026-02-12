package com.example.auth.dto.notification;

import com.example.auth.entity.NotificationType;

public record CreateNotificationRequest(
    Long recipientId,
    Long senderId,
    Long workspaceId,
    NotificationType type,
    String title,
    String message,
    String relatedUrl
) {}
