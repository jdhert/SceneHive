package com.example.auth.service;

import com.example.auth.dto.workspace.*;
import com.example.auth.entity.User;
import com.example.auth.entity.Workspace;
import com.example.auth.entity.WorkspaceMember;
import com.example.auth.entity.WorkspaceRole;
import com.example.auth.exception.CustomException;
import com.example.auth.repository.UserRepository;
import com.example.auth.repository.WorkspaceMemberRepository;
import com.example.auth.repository.WorkspaceRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class WorkspaceService {

    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository memberRepository;
    private final UserRepository userRepository;

    public WorkspaceService(WorkspaceRepository workspaceRepository,
                           WorkspaceMemberRepository memberRepository,
                           UserRepository userRepository) {
        this.workspaceRepository = workspaceRepository;
        this.memberRepository = memberRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public WorkspaceResponse createWorkspace(CreateWorkspaceRequest request, String ownerEmail) {
        User owner = userRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다", HttpStatus.NOT_FOUND));

        Workspace workspace = Workspace.builder()
                .name(request.name())
                .description(request.description())
                .owner(owner)
                .build();

        Workspace savedWorkspace = workspaceRepository.save(workspace);

        // Add owner as a member with OWNER role
        WorkspaceMember ownerMember = WorkspaceMember.builder()
                .workspace(savedWorkspace)
                .user(owner)
                .role(WorkspaceRole.OWNER)
                .build();

        memberRepository.save(ownerMember);
        savedWorkspace.getMembers().add(ownerMember);

        return WorkspaceResponse.from(savedWorkspace);
    }

    @Transactional(readOnly = true)
    public List<WorkspaceResponse> getMyWorkspaces(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다", HttpStatus.NOT_FOUND));

        List<Workspace> workspaces = workspaceRepository.findAllByMemberId(user.getId());

        return workspaces.stream()
                .map(WorkspaceResponse::simpleFrom)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public WorkspaceResponse getWorkspace(Long workspaceId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다", HttpStatus.NOT_FOUND));

        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new CustomException("워크스페이스를 찾을 수 없습니다", HttpStatus.NOT_FOUND));

        validateMembership(workspaceId, user.getId());

        return WorkspaceResponse.from(workspace);
    }

    @Transactional
    public WorkspaceResponse updateWorkspace(Long workspaceId, UpdateWorkspaceRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다", HttpStatus.NOT_FOUND));

        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new CustomException("워크스페이스를 찾을 수 없습니다", HttpStatus.NOT_FOUND));

        validateAdminAccess(workspaceId, user.getId());

        workspace.setName(request.name());
        workspace.setDescription(request.description());

        Workspace updatedWorkspace = workspaceRepository.save(workspace);
        return WorkspaceResponse.from(updatedWorkspace);
    }

    @Transactional
    public void deleteWorkspace(Long workspaceId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다", HttpStatus.NOT_FOUND));

        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new CustomException("워크스페이스를 찾을 수 없습니다", HttpStatus.NOT_FOUND));

        if (!workspace.getOwner().getId().equals(user.getId())) {
            throw new CustomException("워크스페이스 소유자만 삭제할 수 있습니다", HttpStatus.FORBIDDEN);
        }

        workspaceRepository.delete(workspace);
    }

    @Transactional(readOnly = true)
    public List<WorkspaceMemberResponse> getMembers(Long workspaceId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다", HttpStatus.NOT_FOUND));

        validateMembership(workspaceId, user.getId());

        List<WorkspaceMember> members = memberRepository.findAllByWorkspaceId(workspaceId);

        return members.stream()
                .map(WorkspaceMemberResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public void removeMember(Long workspaceId, Long targetUserId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다", HttpStatus.NOT_FOUND));

        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new CustomException("워크스페이스를 찾을 수 없습니다", HttpStatus.NOT_FOUND));

        // Cannot remove owner
        if (workspace.getOwner().getId().equals(targetUserId)) {
            throw new CustomException("워크스페이스 소유자는 제거할 수 없습니다", HttpStatus.BAD_REQUEST);
        }

        validateAdminAccess(workspaceId, user.getId());

        memberRepository.deleteByWorkspaceIdAndUserId(workspaceId, targetUserId);
    }

    @Transactional
    public boolean leaveWorkspace(Long workspaceId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다", HttpStatus.NOT_FOUND));

        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new CustomException("워크스페이스를 찾을 수 없습니다", HttpStatus.NOT_FOUND));

        if (!memberRepository.existsByWorkspaceIdAndUserId(workspaceId, user.getId())) {
            throw new CustomException("워크스페이스에 대한 권한이 없습니다", HttpStatus.FORBIDDEN);
        }

        if (workspace.getOwner().getId().equals(user.getId())) {
            workspaceRepository.delete(workspace);
            return true;
        }
        memberRepository.deleteByWorkspaceIdAndUserId(workspaceId, user.getId());
        return false;
    }

    @Transactional
    public WorkspaceResponse joinWorkspace(String inviteCode, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다", HttpStatus.NOT_FOUND));

        Workspace workspace = workspaceRepository.findByInviteCode(inviteCode)
                .orElseThrow(() -> new CustomException("유효하지 않은 초대 코드입니다", HttpStatus.NOT_FOUND));

        if (memberRepository.existsByWorkspaceIdAndUserId(workspace.getId(), user.getId())) {
            throw new CustomException("이미 워크스페이스에 참여하고 있습니다", HttpStatus.BAD_REQUEST);
        }

        WorkspaceMember member = WorkspaceMember.builder()
                .workspace(workspace)
                .user(user)
                .role(WorkspaceRole.MEMBER)
                .build();

        memberRepository.save(member);

        return WorkspaceResponse.simpleFrom(workspace);
    }

    @Transactional
    public String regenerateInviteCode(Long workspaceId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다", HttpStatus.NOT_FOUND));

        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new CustomException("워크스페이스를 찾을 수 없습니다", HttpStatus.NOT_FOUND));

        validateAdminAccess(workspaceId, user.getId());

        workspace.setInviteCode(UUID.randomUUID().toString());
        workspaceRepository.save(workspace);

        return workspace.getInviteCode();
    }

    // Helper methods
    private void validateMembership(Long workspaceId, Long userId) {
        if (!memberRepository.existsByWorkspaceIdAndUserId(workspaceId, userId)) {
            throw new CustomException("워크스페이스에 접근 권한이 없습니다", HttpStatus.FORBIDDEN);
        }
    }

    private void validateAdminAccess(Long workspaceId, Long userId) {
        WorkspaceRole role = memberRepository.findRoleByWorkspaceIdAndUserId(workspaceId, userId)
                .orElseThrow(() -> new CustomException("워크스페이스에 접근 권한이 없습니다", HttpStatus.FORBIDDEN));

        if (role != WorkspaceRole.OWNER && role != WorkspaceRole.ADMIN) {
            throw new CustomException("관리자 권한이 필요합니다", HttpStatus.FORBIDDEN);
        }
    }

    public boolean isMember(Long workspaceId, String userEmail) {
        User user = userRepository.findByEmail(userEmail).orElse(null);
        if (user == null) return false;
        return memberRepository.existsByWorkspaceIdAndUserId(workspaceId, user.getId());
    }

    public boolean isAdmin(Long workspaceId, String userEmail) {
        User user = userRepository.findByEmail(userEmail).orElse(null);
        if (user == null) return false;

        WorkspaceRole role = memberRepository.findRoleByWorkspaceIdAndUserId(workspaceId, user.getId())
                .orElse(null);

        return role == WorkspaceRole.OWNER || role == WorkspaceRole.ADMIN;
    }

    @Transactional(readOnly = true)
    public List<Long> getWorkspaceIdsForUser(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new CustomException("?ъ슜?먮? 李얠쓣 ???놁뒿?덈떎", HttpStatus.NOT_FOUND));
        return memberRepository.findWorkspaceIdsByUserId(user.getId());
    }
}
