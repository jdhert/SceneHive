package com.example.auth.repository;

import com.example.auth.entity.WorkspaceMember;
import com.example.auth.entity.WorkspaceRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkspaceMemberRepository extends JpaRepository<WorkspaceMember, Long> {

    @Query("SELECT wm FROM WorkspaceMember wm WHERE wm.workspace.id = :workspaceId AND wm.user.id = :userId")
    Optional<WorkspaceMember> findByWorkspaceIdAndUserId(@Param("workspaceId") Long workspaceId, @Param("userId") Long userId);

    @Query("SELECT wm FROM WorkspaceMember wm JOIN FETCH wm.user WHERE wm.workspace.id = :workspaceId")
    List<WorkspaceMember> findAllByWorkspaceId(@Param("workspaceId") Long workspaceId);

    boolean existsByWorkspaceIdAndUserId(Long workspaceId, Long userId);

    @Query("SELECT wm.role FROM WorkspaceMember wm WHERE wm.workspace.id = :workspaceId AND wm.user.id = :userId")
    Optional<WorkspaceRole> findRoleByWorkspaceIdAndUserId(@Param("workspaceId") Long workspaceId, @Param("userId") Long userId);

    @Query("SELECT wm.workspace.id FROM WorkspaceMember wm WHERE wm.user.id = :userId")
    List<Long> findWorkspaceIdsByUserId(@Param("userId") Long userId);

    void deleteByWorkspaceIdAndUserId(Long workspaceId, Long userId);
}
