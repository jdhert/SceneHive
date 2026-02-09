package com.example.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 새 비밀번호 설정 DTO (토큰 + 새 비밀번호)
 */
public record ResetPasswordRequest(
    @NotBlank(message = "토큰은 필수입니다")
    String token,

    @NotBlank(message = "새 비밀번호는 필수입니다")
    @Size(min = 8, message = "비밀번호는 최소 8자 이상이어야 합니다")
    String newPassword
) {}
