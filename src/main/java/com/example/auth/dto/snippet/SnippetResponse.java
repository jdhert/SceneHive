package com.example.auth.dto.snippet;

import com.example.auth.dto.UserResponse;
import com.example.auth.entity.CodeSnippet;

import java.time.LocalDateTime;

public record SnippetResponse(
    Long id,
    Long workspaceId,
    String title,
    String code,
    String language,
    String description,
    UserResponse author,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
    public static SnippetResponse from(CodeSnippet snippet) {
        return new SnippetResponse(
            snippet.getId(),
            snippet.getWorkspace().getId(),
            snippet.getTitle(),
            snippet.getCode(),
            snippet.getLanguage(),
            snippet.getDescription(),
            UserResponse.from(snippet.getAuthor()),
            snippet.getCreatedAt(),
            snippet.getUpdatedAt()
        );
    }
}
