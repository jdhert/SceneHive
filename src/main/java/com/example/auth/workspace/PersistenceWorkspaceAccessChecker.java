package com.example.auth.workspace;

import com.example.auth.entity.Workspace;
import com.example.auth.entity.WorkspaceMember;
import com.example.auth.entity.WorkspaceRole;
import com.example.auth.exception.CustomException;
import com.example.auth.repository.WorkspaceMemberRepository;
import com.example.auth.repository.WorkspaceRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
public class PersistenceWorkspaceAccessChecker implements WorkspaceAccessChecker {

    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository memberRepository;

    public PersistenceWorkspaceAccessChecker(WorkspaceRepository workspaceRepository,
                                             WorkspaceMemberRepository memberRepository) {
        this.workspaceRepository = workspaceRepository;
        this.memberRepository = memberRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Workspace requireWorkspace(Long workspaceId) {
        return workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new CustomException("워크스페이스를 찾을 수 없습니다", HttpStatus.NOT_FOUND));
    }

    @Override
    @Transactional(readOnly = true)
    public void requireMember(Long workspaceId, Long userId) {
        if (!memberRepository.existsByWorkspaceIdAndUserId(workspaceId, userId)) {
            throw new CustomException("워크스페이스에 접근 권한이 없습니다", HttpStatus.FORBIDDEN);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isAdminOrOwner(Long workspaceId, Long userId) {
        WorkspaceRole role = memberRepository.findRoleByWorkspaceIdAndUserId(workspaceId, userId)
                .orElse(null);
        return role == WorkspaceRole.OWNER || role == WorkspaceRole.ADMIN;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Long> findWorkspaceIdsForUser(Long userId) {
        return memberRepository.findWorkspaceIdsByUserId(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Workspace> findWorkspacesByIds(List<Long> workspaceIds) {
        return workspaceRepository.findAllById(workspaceIds);
    }

    @Override
    @Transactional(readOnly = true)
    public List<WorkspaceMember> findMembers(Long workspaceId) {
        return memberRepository.findAllByWorkspaceId(workspaceId);
    }
}
