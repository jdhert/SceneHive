package com.example.auth.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * 토큰 갱신 요청 DTO (Record)
 *
 * 변경점:
 * - 기존: getRefreshToken()
 * - Record: refreshToken()
 */
public record RefreshTokenRequest(
    @NotBlank(message = "Refresh token은 필수입니다")
    String refreshToken
) {}
