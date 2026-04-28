package com.example.auth.identity;

import com.example.auth.entity.UserStatus;

import java.util.Optional;

public interface IdentityPresenceUpdater {

    Optional<PresenceUpdate> updatePresence(String email, boolean online);

    record PresenceUpdate(Long userId, String email, UserStatus previousStatus, UserStatus currentStatus) {
        public boolean changed() {
            return previousStatus != currentStatus;
        }
    }
}
