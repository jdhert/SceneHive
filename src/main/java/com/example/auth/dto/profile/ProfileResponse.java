package com.example.auth.dto.profile;

import com.example.auth.entity.User;
import com.example.auth.entity.UserStatus;

import java.time.LocalDateTime;

public record ProfileResponse(
    Long id,
    String email,
    String name,
    String profilePictureUrl,
    String bio,
    String jobTitle,
    String company,
    UserStatus status,
    LocalDateTime lastSeenAt,
    LocalDateTime createdAt
) {
    public static ProfileResponse from(User user) {
        return new ProfileResponse(
            user.getId(),
            user.getEmail(),
            user.getName(),
            user.getProfilePictureUrl(),
            user.getBio(),
            user.getJobTitle(),
            user.getCompany(),
            user.getStatus(),
            user.getLastSeenAt(),
            user.getCreatedAt()
        );
    }
}
