package com.example.auth.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * 인증 응답 DTO (Record)
 *
 * 변경점:
 * - 기존: AuthResponse.builder().accessToken("...").build()
 * - Record: AuthResponse.ofLogin(...) 또는 new AuthResponse(...)
 *
 * Record는 불변이므로 Builder 대신 정적 팩토리 메서드 사용
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record AuthResponse(
    String accessToken,
    String refreshToken,
    String tokenType,
    Long expiresIn,
    String message,
    Long userId
) {
    /**
     * 로그인 성공 응답 생성
     */
    public static AuthResponse ofLogin(String accessToken, String refreshToken, Long expiresIn) {
        return new AuthResponse(accessToken, refreshToken, "Bearer", expiresIn, null, null);
    }

    /**
     * 회원가입 성공 응답 생성
     */
    public static AuthResponse ofRegister(String message, Long userId) {
        return new AuthResponse(null, null, null, null, message, userId);
    }

    /**
     * 토큰 갱신 응답 생성
     */
    public static AuthResponse ofRefresh(String accessToken, Long expiresIn) {
        return new AuthResponse(accessToken, null, "Bearer", expiresIn, null, null);
    }
}
