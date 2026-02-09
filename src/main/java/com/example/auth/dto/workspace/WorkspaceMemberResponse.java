package com.example.auth.dto.workspace;

import com.example.auth.dto.UserResponse;
import com.example.auth.entity.WorkspaceMember;
import com.example.auth.entity.WorkspaceRole;

import java.time.LocalDateTime;

public record WorkspaceMemberResponse(
    Long id,
    UserResponse user,
    WorkspaceRole role,
    LocalDateTime joinedAt
) {
    public static WorkspaceMemberResponse from(WorkspaceMember member) {
        return new WorkspaceMemberResponse(
            member.getId(),
            UserResponse.from(member.getUser()),
            member.getRole(),
            member.getJoinedAt()
        );
    }
}
