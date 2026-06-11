package com.example.auth.dto.genre;

import com.example.auth.entity.GenrePreferenceMediaType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record UpdateGenrePreferencesRequest(
        @NotNull
        GenrePreferenceMediaType mediaType,

        @Valid
        @NotNull
        @Size(max = 20)
        List<GenrePreferenceItemRequest> genres
) {
}
