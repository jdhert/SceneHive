package com.example.auth.dto;

import com.example.auth.entity.User;
import com.example.auth.entity.AuthProvider;
import com.example.auth.entity.UserStatus;
import java.time.LocalDateTime;

public record UserResponse(
    Long id,
    String email,
    String name,
    AuthProvider provider,
    String profilePictureUrl,
    UserStatus status,
    LocalDateTime createdAt
) {
    public static UserResponse from(User user) {
        return new UserResponse(
            user.getId(),
            user.getEmail(),
            user.getName(),
            user.getProvider(),
            user.getProfilePictureUrl(),
            user.getStatus(),
            user.getCreatedAt()
        );
    }
}
