package com.example.auth.event;

public record ChatMessageCreatedEvent(
        Long workspaceId,
        Long senderId,
        String senderName,
        String senderEmail,
        String content
) {}
