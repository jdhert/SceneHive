package com.example.auth.dto.genre;

import com.example.auth.entity.GenrePreferenceMediaType;
import com.example.auth.entity.UserGenrePreference;

import java.time.LocalDateTime;

public record GenrePreferenceResponse(
        Long id,
        GenrePreferenceMediaType mediaType,
        Integer genreId,
        String genreName,
        Integer priority,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static GenrePreferenceResponse from(UserGenrePreference preference) {
        return new GenrePreferenceResponse(
                preference.getId(),
                preference.getMediaType(),
                preference.getGenreId(),
                preference.getGenreName(),
                preference.getPriority(),
                preference.getCreatedAt(),
                preference.getUpdatedAt()
        );
    }
}
