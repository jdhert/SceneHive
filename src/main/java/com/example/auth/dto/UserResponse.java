package com.example.auth.dto;

import com.example.auth.entity.User;
import java.time.LocalDateTime;

/**
 * 사용자 정보 응답 DTO (Record)
 *
 * 변경점:
 * - 기존: UserResponse.builder().id(...).email(...).build()
 * - Record: UserResponse.from(user) 또는 new UserResponse(...)
 */
public record UserResponse(
    Long id,
    String email,
    String name,
    LocalDateTime createdAt
) {
    /**
     * User Entity로부터 UserResponse 생성
     */
    public static UserResponse from(User user) {
        return new UserResponse(
            user.getId(),
            user.getEmail(),
            user.getName(),
            user.getCreatedAt()
        );
    }
}
