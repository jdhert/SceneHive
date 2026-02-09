package com.example.auth.dto.settings;

import com.example.auth.entity.Theme;
import com.example.auth.entity.UserSettings;

public record UserSettingsResponse(
    Long id,
    Theme theme,
    String language,
    boolean emailNotifications,
    boolean pushNotifications,
    boolean mentionNotifications
) {
    public static UserSettingsResponse from(UserSettings settings) {
        return new UserSettingsResponse(
            settings.getId(),
            settings.getTheme(),
            settings.getLanguage(),
            settings.isEmailNotifications(),
            settings.isPushNotifications(),
            settings.isMentionNotifications()
        );
    }
}
