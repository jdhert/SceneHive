package com.example.auth.controller;

import com.example.auth.dto.workspace.*;
import com.example.auth.service.WorkspaceService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/workspaces")
public class WorkspaceController {

    private final WorkspaceService workspaceService;
    private final SimpMessagingTemplate messagingTemplate;

    public WorkspaceController(WorkspaceService workspaceService, SimpMessagingTemplate messagingTemplate) {
        this.workspaceService = workspaceService;
        this.messagingTemplate = messagingTemplate;
    }

    @PostMapping
    public ResponseEntity<WorkspaceResponse> createWorkspace(
            @Valid @RequestBody CreateWorkspaceRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(workspaceService.createWorkspace(request, userDetails.getUsername()));
    }

    @GetMapping
    public ResponseEntity<List<WorkspaceResponse>> getMyWorkspaces(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(workspaceService.getMyWorkspaces(userDetails.getUsername()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<WorkspaceResponse> getWorkspace(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(workspaceService.getWorkspace(id, userDetails.getUsername()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<WorkspaceResponse> updateWorkspace(
            @PathVariable Long id,
            @Valid @RequestBody UpdateWorkspaceRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(workspaceService.updateWorkspace(id, request, userDetails.getUsername()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWorkspace(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        workspaceService.deleteWorkspace(id, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/members")
    public ResponseEntity<List<WorkspaceMemberResponse>> getMembers(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(workspaceService.getMembers(id, userDetails.getUsername()));
    }

    @DeleteMapping("/{id}/members/{userId}")
    public ResponseEntity<Void> removeMember(
            @PathVariable Long id,
            @PathVariable Long userId,
            @AuthenticationPrincipal UserDetails userDetails) {
        workspaceService.removeMember(id, userId, userDetails.getUsername());
        notifyMembersUpdated(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}/members/me")
    public ResponseEntity<Void> leaveWorkspace(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        boolean deleted = workspaceService.leaveWorkspace(id, userDetails.getUsername());
        if (!deleted) {
            notifyMembersUpdated(id);
        }
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/join/{inviteCode}")
    public ResponseEntity<WorkspaceResponse> joinWorkspace(
            @PathVariable String inviteCode,
            @AuthenticationPrincipal UserDetails userDetails) {
        WorkspaceResponse response = workspaceService.joinWorkspace(inviteCode, userDetails.getUsername());
        notifyMembersUpdated(response.id());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/invite")
    public ResponseEntity<Map<String, String>> regenerateInviteCode(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        String newCode = workspaceService.regenerateInviteCode(id, userDetails.getUsername());
        return ResponseEntity.ok(Map.of("inviteCode", newCode));
    }

    private void notifyMembersUpdated(Long workspaceId) {
        messagingTemplate.convertAndSend(
                "/topic/workspace/" + workspaceId + "/members",
                Map.of("type", "MEMBERS_UPDATED", "workspaceId", workspaceId)
        );
    }
}
