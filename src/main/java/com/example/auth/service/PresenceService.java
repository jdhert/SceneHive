package com.example.auth.service;

import com.example.auth.identity.IdentityPresenceUpdater;
import com.example.auth.workspace.WorkspaceAccessChecker;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class PresenceService {

    private static final Logger log = LoggerFactory.getLogger(PresenceService.class);

    private final IdentityPresenceUpdater identityPresenceUpdater;
    private final WorkspaceAccessChecker workspaceAccessChecker;
    private final SimpMessagingTemplate messagingTemplate;
    private final JwtService jwtService;

    private final ConcurrentMap<String, String> sessionToUser = new ConcurrentHashMap<>();
    private final ConcurrentMap<String, AtomicInteger> userSessionCounts = new ConcurrentHashMap<>();

    public PresenceService(IdentityPresenceUpdater identityPresenceUpdater,
                           WorkspaceAccessChecker workspaceAccessChecker,
                           SimpMessagingTemplate messagingTemplate,
                           JwtService jwtService) {
        this.identityPresenceUpdater = identityPresenceUpdater;
        this.workspaceAccessChecker = workspaceAccessChecker;
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

    protected void updateStatus(String email, boolean online) {
        identityPresenceUpdater.updatePresence(email, online)
                .ifPresent(update -> {
                    if (update.changed()) {
                        log.info("Presence change: {} {} -> {}",
                                email,
                                update.previousStatus(),
                                update.currentStatus());
                    }
                    notifyMembersUpdated(update);
                });
    }

    private void notifyMembersUpdated(IdentityPresenceUpdater.PresenceUpdate update) {
        try {
            List<Long> workspaceIds = workspaceAccessChecker.findWorkspaceIdsForUser(update.userId());
            for (Long workspaceId : workspaceIds) {
                messagingTemplate.convertAndSend(
                        "/topic/workspace/" + workspaceId + "/members",
                        Map.of("type", "MEMBERS_UPDATED", "workspaceId", workspaceId)
                );
            }
        } catch (Exception e) {
            log.warn("Failed to notify member updates for {}", update.email(), e);
        }
    }
}
