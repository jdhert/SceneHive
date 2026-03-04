package com.example.auth.service;

import com.example.auth.dto.workspace.CreateWorkspaceRequest;
import com.example.auth.dto.workspace.WorkspaceResponse;
import com.example.auth.entity.User;
import com.example.auth.entity.Workspace;
import com.example.auth.entity.WorkspaceMember;
import com.example.auth.entity.WorkspaceRole;
import com.example.auth.exception.CustomException;
import com.example.auth.repository.UserRepository;
import com.example.auth.repository.WorkspaceMemberRepository;
import com.example.auth.repository.WorkspaceRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WorkspaceServiceTest {

    @Mock
    private WorkspaceRepository workspaceRepository;

    @Mock
    private WorkspaceMemberRepository memberRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private WorkspaceService workspaceService;

    @Test
    void createWorkspaceCreatesOwnerMembership() {
        User owner = testUser(10L, "owner@test.com");
        when(userRepository.findByEmail("owner@test.com")).thenReturn(Optional.of(owner));
        when(workspaceRepository.save(any(Workspace.class))).thenAnswer(invocation -> {
            Workspace workspace = invocation.getArgument(0);
            workspace.setId(100L);
            workspace.setInviteCode("invite-100");
            return workspace;
        });
        when(memberRepository.save(any(WorkspaceMember.class))).thenAnswer(invocation -> invocation.getArgument(0));

        WorkspaceResponse response = workspaceService.createWorkspace(
                new CreateWorkspaceRequest("DevCollab", "Team workspace"),
                "owner@test.com"
        );

        assertEquals("DevCollab", response.name());
        assertEquals("invite-100", response.inviteCode());
        assertEquals(1, response.memberCount());
        assertEquals("owner@test.com", response.owner().email());

        ArgumentCaptor<WorkspaceMember> captor = ArgumentCaptor.forClass(WorkspaceMember.class);
        verify(memberRepository).save(captor.capture());
        assertEquals(WorkspaceRole.OWNER, captor.getValue().getRole());
    }

    @Test
    void leaveWorkspaceDeletesWorkspaceWhenOwnerLeaves() {
        User owner = testUser(10L, "owner@test.com");
        Workspace workspace = Workspace.builder()
                .id(100L)
                .name("DevCollab")
                .owner(owner)
                .build();

        when(userRepository.findByEmail("owner@test.com")).thenReturn(Optional.of(owner));
        when(workspaceRepository.findById(100L)).thenReturn(Optional.of(workspace));
        when(memberRepository.existsByWorkspaceIdAndUserId(100L, 10L)).thenReturn(true);

        boolean deleted = workspaceService.leaveWorkspace(100L, "owner@test.com");

        assertTrue(deleted);
        verify(workspaceRepository).delete(workspace);
        verify(memberRepository, never()).deleteByWorkspaceIdAndUserId(100L, 10L);
    }

    @Test
    void leaveWorkspaceRemovesMembershipForNonOwner() {
        User owner = testUser(10L, "owner@test.com");
        User member = testUser(11L, "member@test.com");
        Workspace workspace = Workspace.builder()
                .id(100L)
                .name("DevCollab")
                .owner(owner)
                .build();

        when(userRepository.findByEmail("member@test.com")).thenReturn(Optional.of(member));
        when(workspaceRepository.findById(100L)).thenReturn(Optional.of(workspace));
        when(memberRepository.existsByWorkspaceIdAndUserId(100L, 11L)).thenReturn(true);

        boolean deleted = workspaceService.leaveWorkspace(100L, "member@test.com");

        assertFalse(deleted);
        verify(memberRepository).deleteByWorkspaceIdAndUserId(100L, 11L);
        verify(workspaceRepository, never()).delete(workspace);
    }

    @Test
    void joinWorkspaceThrowsWhenAlreadyMember() {
        User user = testUser(11L, "member@test.com");
        Workspace workspace = Workspace.builder()
                .id(100L)
                .name("DevCollab")
                .owner(testUser(10L, "owner@test.com"))
                .build();

        when(userRepository.findByEmail("member@test.com")).thenReturn(Optional.of(user));
        when(workspaceRepository.findByInviteCode("invite-100")).thenReturn(Optional.of(workspace));
        when(memberRepository.existsByWorkspaceIdAndUserId(100L, 11L)).thenReturn(true);

        CustomException exception = assertThrows(
                CustomException.class,
                () -> workspaceService.joinWorkspace("invite-100", "member@test.com")
        );

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
        verify(memberRepository, never()).save(any(WorkspaceMember.class));
    }

    private User testUser(Long id, String email) {
        return User.builder()
                .id(id)
                .email(email)
                .name("Test User")
                .password("encoded")
                .build();
    }
}
