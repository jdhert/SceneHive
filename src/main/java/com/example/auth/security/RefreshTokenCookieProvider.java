package com.example.auth.security;

import com.example.auth.service.JwtService;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
public class RefreshTokenCookieProvider {

    public static final String REFRESH_COOKIE_NAME = "refresh_token";

    private final JwtService jwtService;

    public RefreshTokenCookieProvider(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    public ResponseCookie create(String refreshToken, boolean secure) {
        return ResponseCookie.from(REFRESH_COOKIE_NAME, refreshToken)
                .httpOnly(true)
                .secure(secure)
                .sameSite("Lax")
                .path("/")
                .maxAge(Duration.ofMillis(jwtService.getRefreshTokenExpiration()))
                .build();
    }

    public ResponseCookie clear(boolean secure) {
        return ResponseCookie.from(REFRESH_COOKIE_NAME, "")
                .httpOnly(true)
                .secure(secure)
                .sameSite("Lax")
                .path("/")
                .maxAge(Duration.ZERO)
                .build();
    }
}
