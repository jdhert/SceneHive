package com.example.auth.security;

import com.example.auth.service.JwtService;
import org.springframework.beans.factory.annotation.Value;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Component
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private static final Logger log = LoggerFactory.getLogger(OAuth2AuthenticationSuccessHandler.class);

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;
    private final RefreshTokenCookieProvider refreshTokenCookieProvider;
    private final String frontendUrl;

    public OAuth2AuthenticationSuccessHandler(JwtService jwtService,
                                             UserDetailsService userDetailsService,
                                             RefreshTokenCookieProvider refreshTokenCookieProvider,
                                             @Value("${app.frontend-url:http://localhost:3000}") String frontendUrl) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
        this.refreshTokenCookieProvider = refreshTokenCookieProvider;
        this.frontendUrl = frontendUrl;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        try {
            OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
            String email = (String) oAuth2User.getAttributes().get("email");

            if (email == null) {
                throw new IllegalStateException("Email not found from OAuth2 provider");
            }

            log.info("OAuth2 Login Success for email: {}", email);

            UserDetails userDetails = userDetailsService.loadUserByUsername(email);

            String accessToken = jwtService.generateAccessToken(userDetails);
            String refreshToken = jwtService.generateRefreshToken(userDetails);

            var cookie = refreshTokenCookieProvider.create(refreshToken, request.isSecure());
            response.addHeader("Set-Cookie", cookie.toString());

            String targetUrl = UriComponentsBuilder.fromUriString(frontendUrl + "/oauth2/redirect")
                    .queryParam("accessToken", accessToken)
                    .build().toUriString();

            getRedirectStrategy().sendRedirect(request, response, targetUrl);
        } catch (Exception e) {
            log.error("OAuth2 Login failed: {}", e.getMessage());
            response.sendRedirect(frontendUrl + "/login?error=oauth2__failed");
        }
    }
}
