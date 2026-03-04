package com.example.auth.entity;

public enum AuthProvider {
    LOCAL,
    GOOGLE,
    KAKAO,
    NAVER;

    public static AuthProvider fromRegistrationId(String registrationId) {
        if (registrationId == null || registrationId.isBlank()) {
            throw new IllegalArgumentException("registrationId must not be blank");
        }
        return switch (registrationId.toLowerCase()) {
            case "google" -> GOOGLE;
            case "kakao" -> KAKAO;
            case "naver" -> NAVER;
            default -> throw new IllegalArgumentException("Unsupported provider: " + registrationId);
        };
    }
}
