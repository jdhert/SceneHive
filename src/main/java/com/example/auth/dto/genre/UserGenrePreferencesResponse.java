package com.example.auth.dto.genre;

import java.util.List;

public record UserGenrePreferencesResponse(
        List<GenrePreferenceResponse> preferences
) {
}
