package com.example.auth.service;

import com.example.auth.dto.settings.UpdateSettingsRequest;
import com.example.auth.dto.settings.UserSettingsResponse;
import com.example.auth.entity.User;
import com.example.auth.entity.UserSettings;
import com.example.auth.exception.CustomException;
import com.example.auth.repository.UserRepository;
import com.example.auth.repository.UserSettingsRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserSettingsService {

    private final UserSettingsRepository settingsRepository;
    private final UserRepository userRepository;

    public UserSettingsService(UserSettingsRepository settingsRepository, UserRepository userRepository) {
        this.settingsRepository = settingsRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public UserSettingsResponse getSettings(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다", HttpStatus.NOT_FOUND));

        UserSettings settings = settingsRepository.findByUserId(user.getId())
                .orElseGet(() -> createDefaultSettings(user));

        return UserSettingsResponse.from(settings);
    }

    @Transactional
    public UserSettingsResponse updateSettings(String email, UpdateSettingsRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다", HttpStatus.NOT_FOUND));

        UserSettings settings = settingsRepository.findByUserId(user.getId())
                .orElseGet(() -> createDefaultSettings(user));

        if (request.theme() != null) {
            settings.setTheme(request.theme());
        }
        if (request.language() != null) {
            settings.setLanguage(request.language());
        }
        if (request.emailNotifications() != null) {
            settings.setEmailNotifications(request.emailNotifications());
        }
        if (request.pushNotifications() != null) {
            settings.setPushNotifications(request.pushNotifications());
        }
        if (request.mentionNotifications() != null) {
            settings.setMentionNotifications(request.mentionNotifications());
        }

        UserSettings updatedSettings = settingsRepository.save(settings);
        return UserSettingsResponse.from(updatedSettings);
    }

    @Transactional
    public UserSettings createDefaultSettings(User user) {
        UserSettings settings = UserSettings.builder()
                .user(user)
                .build();
        return settingsRepository.save(settings);
    }

    @Transactional
    public void createSettingsForNewUser(User user) {
        if (!settingsRepository.existsByUserId(user.getId())) {
            createDefaultSettings(user);
        }
    }
}
