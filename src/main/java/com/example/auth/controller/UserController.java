package com.example.auth.controller;

import com.example.auth.dto.profile.ProfileResponse;
import com.example.auth.dto.profile.PublicProfileResponse;
import com.example.auth.dto.profile.UpdateProfileRequest;
import com.example.auth.dto.profile.UpdateStatusRequest;
import com.example.auth.dto.settings.UpdateSettingsRequest;
import com.example.auth.dto.settings.UserSettingsResponse;
import com.example.auth.service.FileStorageService;
import com.example.auth.service.UserService;
import com.example.auth.service.UserSettingsService;
import com.example.auth.service.WorkspaceService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final UserSettingsService settingsService;
    private final FileStorageService fileStorageService;
    private final WorkspaceService workspaceService;
    private final SimpMessagingTemplate messagingTemplate;

    public UserController(UserService userService, UserSettingsService settingsService,
                          FileStorageService fileStorageService,
                          WorkspaceService workspaceService,
                          SimpMessagingTemplate messagingTemplate) {
        this.userService = userService;
        this.settingsService = settingsService;
        this.fileStorageService = fileStorageService;
        this.workspaceService = workspaceService;
        this.messagingTemplate = messagingTemplate;
    }

    @GetMapping("/me")
    public ResponseEntity<ProfileResponse> getMyProfile(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(userService.getProfile(userDetails.getUsername()));
    }

    @PutMapping("/me")
    public ResponseEntity<ProfileResponse> updateMyProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UpdateProfileRequest request) {
        ProfileResponse response = userService.updateProfile(userDetails.getUsername(), request);
        notifyMembersUpdated(userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/me/status")
    public ResponseEntity<ProfileResponse> updateStatus(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UpdateStatusRequest request) {
        ProfileResponse response = userService.updateStatus(userDetails.getUsername(), request);
        notifyMembersUpdated(userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/me/avatar")
    public ResponseEntity<ProfileResponse> uploadAvatar(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam("file") MultipartFile file) {
        ProfileResponse currentProfile = userService.getProfile(userDetails.getUsername());

        // Delete old avatar if exists
        if (currentProfile.profilePictureUrl() != null) {
            fileStorageService.deleteAvatar(currentProfile.profilePictureUrl());
        }

        // Store new avatar
        String avatarUrl = fileStorageService.storeAvatar(file, currentProfile.id());

        // Update user profile
        ProfileResponse response = userService.updateProfilePicture(userDetails.getUsername(), avatarUrl);
        notifyMembersUpdated(userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/me/avatar")
    public ResponseEntity<ProfileResponse> deleteAvatar(
            @AuthenticationPrincipal UserDetails userDetails) {
        ProfileResponse currentProfile = userService.getProfile(userDetails.getUsername());

        // Delete avatar file
        if (currentProfile.profilePictureUrl() != null) {
            fileStorageService.deleteAvatar(currentProfile.profilePictureUrl());
        }

        // Update user profile
        ProfileResponse response = userService.deleteProfilePicture(userDetails.getUsername());
        notifyMembersUpdated(userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{userId}")
    public ResponseEntity<PublicProfileResponse> getUserProfile(
            @PathVariable Long userId) {
        return ResponseEntity.ok(userService.getPublicProfile(userId));
    }

    // Settings endpoints
    @GetMapping("/me/settings")
    public ResponseEntity<UserSettingsResponse> getSettings(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(settingsService.getSettings(userDetails.getUsername()));
    }

    @PutMapping("/me/settings")
    public ResponseEntity<UserSettingsResponse> updateSettings(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UpdateSettingsRequest request) {
        return ResponseEntity.ok(settingsService.updateSettings(userDetails.getUsername(), request));
    }

    private void notifyMembersUpdated(String userEmail) {
        List<Long> workspaceIds = workspaceService.getWorkspaceIdsForUser(userEmail);
        for (Long workspaceId : workspaceIds) {
            messagingTemplate.convertAndSend(
                    "/topic/workspace/" + workspaceId + "/members",
                    Map.of("type", "MEMBERS_UPDATED", "workspaceId", workspaceId)
            );
        }
    }
}
