package com.example.auth.config;

import com.example.auth.service.ChatPresenceTracker;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;
import org.springframework.web.socket.messaging.SessionUnsubscribeEvent;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class WebSocketEventListener {

    private static final Logger log = LoggerFactory.getLogger(WebSocketEventListener.class);
    private static final Pattern CHAT_TOPIC = Pattern.compile("/topic/workspace/(\\d+)");

    private final ChatPresenceTracker presenceTracker;

    public WebSocketEventListener(ChatPresenceTracker presenceTracker) {
        this.presenceTracker = presenceTracker;
    }

    @EventListener
    public void handleSubscribe(SessionSubscribeEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        String destination = accessor.getDestination();
        if (destination == null) return;

        Matcher matcher = CHAT_TOPIC.matcher(destination);
        if (!matcher.matches()) return;

        Long workspaceId = Long.parseLong(matcher.group(1));
        String email = event.getUser() != null ? event.getUser().getName() : null;
        if (email == null) return;

        String sessionId = accessor.getSessionId();
        String subscriptionId = accessor.getSubscriptionId();
        presenceTracker.handleSubscribe(sessionId, subscriptionId, workspaceId, email);
        log.debug("User {} subscribed to chat in workspace {}", email, workspaceId);
    }

    @EventListener
    public void handleUnsubscribe(SessionUnsubscribeEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = accessor.getSessionId();
        String subscriptionId = accessor.getSubscriptionId();
        presenceTracker.handleUnsubscribe(sessionId, subscriptionId);
    }

    @EventListener
    public void handleDisconnect(SessionDisconnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        presenceTracker.handleDisconnect(accessor.getSessionId());
        log.debug("WebSocket session disconnected: {}", accessor.getSessionId());
    }
}
