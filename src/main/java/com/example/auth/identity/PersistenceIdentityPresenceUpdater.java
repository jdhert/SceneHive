package com.example.auth.identity;

import com.example.auth.entity.User;
import com.example.auth.entity.UserStatus;
import com.example.auth.repository.UserRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Component
public class PersistenceIdentityPresenceUpdater implements IdentityPresenceUpdater {

    private final UserRepository userRepository;

    public PersistenceIdentityPresenceUpdater(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public Optional<PresenceUpdate> updatePresence(String email, boolean online) {
        return userRepository.findByEmail(email)
                .map(user -> updateStatus(user, online));
    }

    private PresenceUpdate updateStatus(User user, boolean online) {
        UserStatus previousStatus = user.getStatus();
        if (online) {
            if (user.getStatus() == UserStatus.OFFLINE) {
                user.setStatus(UserStatus.ONLINE);
            }
        } else {
            user.setStatus(UserStatus.OFFLINE);
        }
        user.setLastSeenAt(LocalDateTime.now());
        User savedUser = userRepository.save(user);
        return new PresenceUpdate(savedUser.getId(), savedUser.getEmail(), previousStatus, savedUser.getStatus());
    }
}
