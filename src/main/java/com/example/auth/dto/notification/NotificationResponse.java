package com.example.auth.dto.notification;

import com.example.auth.dto.UserResponse;
import com.example.auth.entity.Notification;
import com.example.auth.entity.NotificationType;

import java.time.LocalDateTime;

public record NotificationResponse(
    Long id,
    NotificationType type,
    String title,
    String message,
    boolean isRead,
    UserResponse sender,
    Long workspaceId,
    String workspaceName,
    String relatedUrl,
    LocalDateTime createdAt,
    LocalDateTime readAt
) {
    public static NotificationResponse from(Notification n) {
        return new NotificationResponse(
            n.getId(),
            n.getType(),
            n.getTitle(),
            n.getMessage(),
            n.isRead(),
            n.getSender() != null ? UserResponse.from(n.getSender()) : null,
            n.getWorkspace() != null ? n.getWorkspace().getId() : null,
            n.getWorkspace() != null ? n.getWorkspace().getName() : null,
            n.getRelatedUrl(),
            n.getCreatedAt(),
            n.getReadAt()
        );
    }
}
