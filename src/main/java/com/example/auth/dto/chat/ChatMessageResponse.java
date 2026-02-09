package com.example.auth.dto.chat;

import com.example.auth.dto.UserResponse;
import com.example.auth.entity.ChatMessage;
import com.example.auth.entity.MessageType;

import java.time.LocalDateTime;

public record ChatMessageResponse(
    Long id,
    Long workspaceId,
    String content,
    MessageType type,
    UserResponse sender,
    LocalDateTime createdAt
) {
    public static ChatMessageResponse from(ChatMessage message) {
        return new ChatMessageResponse(
            message.getId(),
            message.getWorkspace().getId(),
            message.getContent(),
            message.getType(),
            UserResponse.from(message.getSender()),
            message.getCreatedAt()
        );
    }
}
