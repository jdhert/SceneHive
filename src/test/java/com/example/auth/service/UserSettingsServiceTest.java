package com.example.auth.service;

import com.example.auth.dto.settings.UpdateSettingsRequest;
import com.example.auth.dto.settings.UserSettingsResponse;
import com.example.auth.entity.Theme;
import com.example.auth.entity.User;
import com.example.auth.entity.UserSettings;
import com.example.auth.exception.CustomException;
import com.example.auth.repository.UserRepository;
import com.example.auth.repository.UserSettingsRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserSettingsServiceTest {

    @Mock
    private UserSettingsRepository settingsRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserSettingsService userSettingsService;

    @Test
    void getSettingsCreatesDefaultsWhenNotFound() {
        User user = testUser(1L, "user@test.com");
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(settingsRepository.findByUserId(1L)).thenReturn(Optional.empty());
        when(settingsRepository.save(any(UserSettings.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserSettingsResponse response = userSettingsService.getSettings("user@test.com");

        assertEquals(Theme.SYSTEM, response.theme());
        assertEquals("ko", response.language());
        assertTrue(response.emailNotifications());
        assertTrue(response.pushNotifications());
        assertTrue(response.mentionNotifications());
        verify(settingsRepository, times(1)).save(any(UserSettings.class));
    }

    @Test
    void updateSettingsAppliesOnlyProvidedFields() {
        User user = testUser(1L, "user@test.com");
        UserSettings existing = UserSettings.builder()
                .user(user)
                .theme(Theme.SYSTEM)
                .language("ko")
                .emailNotifications(true)
                .pushNotifications(true)
                .mentionNotifications(true)
                .build();

        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(settingsRepository.findByUserId(1L)).thenReturn(Optional.of(existing));
        when(settingsRepository.save(any(UserSettings.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateSettingsRequest request = new UpdateSettingsRequest(
                Theme.DARK,
                null,
                false,
                null,
                false
        );

        UserSettingsResponse response = userSettingsService.updateSettings("user@test.com", request);

        assertEquals(Theme.DARK, response.theme());
        assertEquals("ko", response.language());
        assertEquals(false, response.emailNotifications());
        assertEquals(true, response.pushNotifications());
        assertEquals(false, response.mentionNotifications());
    }

    @Test
    void createSettingsForNewUserSkipsWhenAlreadyExists() {
        User user = testUser(1L, "user@test.com");
        when(settingsRepository.existsByUserId(1L)).thenReturn(true);

        userSettingsService.createSettingsForNewUser(user);

        verify(settingsRepository, never()).save(any(UserSettings.class));
    }

    @Test
    void getSettingsThrowsWhenUserMissing() {
        when(userRepository.findByEmail("missing@test.com")).thenReturn(Optional.empty());

        CustomException exception = assertThrows(
                CustomException.class,
                () -> userSettingsService.getSettings("missing@test.com")
        );

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatus());
    }

    private User testUser(Long id, String email) {
        return User.builder()
                .id(id)
                .email(email)
                .name("Test User")
                .password("encoded")
                .build();
    }
}
