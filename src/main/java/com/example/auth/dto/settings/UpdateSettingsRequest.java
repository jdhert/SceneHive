package com.example.auth.dto.settings;

import com.example.auth.entity.Theme;
import jakarta.validation.constraints.Size;

public record UpdateSettingsRequest(
    Theme theme,

    @Size(max = 10, message = "언어 코드는 10자 이하여야 합니다")
    String language,

    Boolean emailNotifications,

    Boolean pushNotifications,

    Boolean mentionNotifications
) {}
