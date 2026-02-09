package com.example.auth.dto.chat;

import com.example.auth.entity.MessageType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChatMessageRequest(
    @NotBlank(message = "메시지 내용은 필수입니다")
    @Size(max = 4000, message = "메시지는 4000자 이하여야 합니다")
    String content,

    MessageType type
) {
    public ChatMessageRequest {
        if (type == null) {
            type = MessageType.TEXT;
        }
    }
}
