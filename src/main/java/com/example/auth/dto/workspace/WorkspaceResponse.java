package com.example.auth.dto.workspace;

import com.example.auth.dto.UserResponse;
import com.example.auth.entity.Workspace;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record WorkspaceResponse(
    Long id,
    String name,
    String description,
    String inviteCode,
    UserResponse owner,
    int memberCount,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
    public static WorkspaceResponse from(Workspace workspace) {
        return new WorkspaceResponse(
            workspace.getId(),
            workspace.getName(),
            workspace.getDescription(),
            workspace.getInviteCode(),
            UserResponse.from(workspace.getOwner()),
            workspace.getMembers().size(),
            workspace.getCreatedAt(),
            workspace.getUpdatedAt()
        );
    }

    public static WorkspaceResponse simpleFrom(Workspace workspace) {
        return new WorkspaceResponse(
            workspace.getId(),
            workspace.getName(),
            workspace.getDescription(),
            null,
            UserResponse.from(workspace.getOwner()),
            workspace.getMembers().size(),
            workspace.getCreatedAt(),
            workspace.getUpdatedAt()
        );
    }
}
