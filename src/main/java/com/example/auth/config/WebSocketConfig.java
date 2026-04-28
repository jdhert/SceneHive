package com.example.auth.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final List<String> allowedOrigins;

    public WebSocketConfig(@Value("${FRONTEND_URL:http://localhost:3000}") String frontendUrl,
                           @Value("${CORS_ALLOWED_ORIGINS:}") String corsAllowedOrigins) {
        this.allowedOrigins = resolveAllowedOrigins(frontendUrl, corsAllowedOrigins);
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // 클라이언트가 구독할 수 있는 주제 prefix
        config.enableSimpleBroker("/topic", "/queue");
        // 클라이언트가 메시지를 보낼 때 사용하는 prefix
        config.setApplicationDestinationPrefixes("/app");
        // 특정 사용자에게 메시지 보낼 때 사용
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // WebSocket 연결 엔드포인트
        registry.addEndpoint("/ws")
                .setAllowedOrigins(allowedOrigins.toArray(String[]::new))
                .withSockJS();
    }

    private static List<String> resolveAllowedOrigins(String frontendUrl, String corsAllowedOrigins) {
        Set<String> origins = new LinkedHashSet<>();
        origins.add("http://localhost:3000");
        origins.add("http://127.0.0.1:3000");
        addOrigin(origins, frontendUrl);

        if (corsAllowedOrigins != null) {
            Arrays.stream(corsAllowedOrigins.split(","))
                    .forEach(origin -> addOrigin(origins, origin));
        }

        return List.copyOf(origins);
    }

    private static void addOrigin(Set<String> origins, String origin) {
        if (origin == null) {
            return;
        }

        String trimmed = origin.trim();
        if (!trimmed.isEmpty()) {
            origins.add(trimmed);
        }
    }
}
