package com.example.auth.service;

import org.springframework.stereotype.Component;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class ChatPresenceTracker {

    // workspaceId -> Set<userEmail>
    private final ConcurrentHashMap<Long, Set<String>> activeUsers = new ConcurrentHashMap<>();

    // subscriptionKey (sessionId-subscriptionId) -> SubscriptionInfo
    private final ConcurrentHashMap<String, SubscriptionInfo> subscriptions = new ConcurrentHashMap<>();

    public void handleSubscribe(String sessionId, String subscriptionId, Long workspaceId, String email) {
        String key = sessionId + "-" + subscriptionId;
        subscriptions.put(key, new SubscriptionInfo(workspaceId, email));
        activeUsers.computeIfAbsent(workspaceId, k -> ConcurrentHashMap.newKeySet()).add(email);
    }

    public void handleUnsubscribe(String sessionId, String subscriptionId) {
        String key = sessionId + "-" + subscriptionId;
        SubscriptionInfo info = subscriptions.remove(key);
        if (info != null) {
            removeUser(info.workspaceId(), info.email());
        }
    }

    public void handleDisconnect(String sessionId) {
        subscriptions.entrySet().removeIf(entry -> {
            if (entry.getKey().startsWith(sessionId + "-")) {
                removeUser(entry.getValue().workspaceId(), entry.getValue().email());
                return true;
            }
            return false;
        });
    }

    public boolean isUserActive(Long workspaceId, String email) {
        Set<String> users = activeUsers.get(workspaceId);
        return users != null && users.contains(email);
    }

    private void removeUser(Long workspaceId, String email) {
        Set<String> users = activeUsers.get(workspaceId);
        if (users != null) {
            users.remove(email);
            if (users.isEmpty()) {
                activeUsers.remove(workspaceId);
            }
        }
    }

    private record SubscriptionInfo(Long workspaceId, String email) {}
}
