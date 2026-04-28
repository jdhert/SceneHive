package com.example.auth.workspace;

import com.example.auth.entity.Workspace;
import com.example.auth.entity.WorkspaceMember;

import java.util.List;
import java.util.Optional;

public interface WorkspaceAccessChecker {

    Workspace requireWorkspace(Long workspaceId);

    Optional<Workspace> findWorkspace(Long workspaceId);

    void requireMember(Long workspaceId, Long userId);

    boolean isAdminOrOwner(Long workspaceId, Long userId);

    List<Long> findWorkspaceIdsForUser(Long userId);

    List<Workspace> findWorkspacesByIds(List<Long> workspaceIds);

    List<WorkspaceMember> findMembers(Long workspaceId);
}
