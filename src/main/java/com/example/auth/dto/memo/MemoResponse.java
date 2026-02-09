package com.example.auth.dto.memo;

import com.example.auth.dto.UserResponse;
import com.example.auth.entity.Memo;

import java.time.LocalDateTime;

public record MemoResponse(
    Long id,
    Long workspaceId,
    String title,
    String content,
    UserResponse author,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
    public static MemoResponse from(Memo memo) {
        return new MemoResponse(
            memo.getId(),
            memo.getWorkspace().getId(),
            memo.getTitle(),
            memo.getContent(),
            UserResponse.from(memo.getAuthor()),
            memo.getCreatedAt(),
            memo.getUpdatedAt()
        );
    }
}
