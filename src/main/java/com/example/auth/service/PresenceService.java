package com.example.auth.service;

import com.example.auth.entity.User;
import com.example.auth.entity.UserStatus;
import com.example.auth.repository.UserRepository;
import com.example.auth.service.JwtService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class PresenceService {

    private static final Logger log = LoggerFactory.getLogger(PresenceService.class);

    private final UserRepository userRepository;
    private final WorkspaceService workspaceService;
    private final SimpMessagingTemplate messagingTemplate;
    private final JwtService jwtService;

    private final ConcurrentMap<String, String> sessionToUser = new ConcurrentHashMap<>();
    private final ConcurrentMap<String, AtomicInteger> userSessionCounts = new ConcurrentHashMap<>();

    public PresenceService(UserRepository userRepository,
                           WorkspaceService workspaceService,
                           SimpMessagingTemplate messagingTemplate,
                           JwtService jwtService) {
        this.userRepository = userRepository;
        this.workspaceService = workspaceService;
        this.messagingTemplate = messagingTemplate;
        this.jwtService = jwtService;
    }

    @EventListener
    public void handleSessionConnect(SessionConnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        if (!isPresenceConnection(accessor)) {
            return;
        }
        String sessionId = accessor.getSessionId();
        String username = resolveUsername(accessor);
        if (sessionId == null || username == null) {
            log.warn("Presence connect ignored: sessionId={}, username={}, headers={}",
                    sessionId,
                    username,
                    accessor.toNativeHeaderMap().keySet());
            return;
        }

        sessionToUser.put(sessionId, username);
        int count = userSessionCounts
                .computeIfAbsent(username, key -> new AtomicInteger(0))
                .incrementAndGet();

        log.info("Presence connect: {} session={}, count={}", username, sessionId, count);
        if (count == 1) {
            updateStatus(username, true);
        }
    }

    @EventListener
    public void handleSessionDisconnect(SessionDisconnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = accessor.getSessionId();
        if (sessionId == null) return;

        String username = sessionToUser.remove(sessionId);
        if (username == null) return;

        AtomicInteger counter = userSessionCounts.get(username);
        if (counter == null) return;

        int count = counter.decrementAndGet();
        log.info("Presence disconnect: {} session={}, count={}", username, sessionId, count);
        if (count <= 0) {
            userSessionCounts.remove(username);
            updateStatus(username, false);
        }
    }

    private String resolveUsername(StompHeaderAccessor accessor) {
        Principal principal = accessor.getUser();
        if (principal != null) {
            return principal.getName();
        }

        String authHeader = accessor.getFirstNativeHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                if (jwtService.validateToken(token)) {
                    return jwtService.extractUsername(token);
                }
            } catch (Exception e) {
                log.debug("Presence auth header validation failed", e);
            }
        }

        return null;
    }

    private boolean isPresenceConnection(StompHeaderAccessor accessor) {
        String presence = accessor.getFirstNativeHeader("X-Presence");
        return "true".equalsIgnoreCase(presence);
    }

    @Transactional
    protected void updateStatus(String email, boolean online) {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) return;

        UserStatus previous = user.getStatus();
        if (online) {
            if (user.getStatus() == UserStatus.OFFLINE) {
                user.setStatus(UserStatus.ONLINE);
            }
        } else {
            user.setStatus(UserStatus.OFFLINE);
        }
        user.setLastSeenAt(LocalDateTime.now());
        userRepository.save(user);

        if (previous != user.getStatus()) {
            log.info("Presence change: {} {} -> {}", email, previous, user.getStatus());
        }
        notifyMembersUpdated(email);
    }

    private void notifyMembersUpdated(String email) {
        try {
            List<Long> workspaceIds = workspaceService.getWorkspaceIdsForUser(email);
            for (Long workspaceId : workspaceIds) {
                messagingTemplate.convertAndSend(
                        "/topic/workspace/" + workspaceId + "/members",
                        Map.of("type", "MEMBERS_UPDATED", "workspaceId", workspaceId)
                );
            }
        } catch (Exception e) {
            log.warn("Failed to notify member updates for {}", email, e);
        }
    }
}
