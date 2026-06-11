package com.example.auth.dto.genre;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record GenrePreferenceItemRequest(
        @NotNull
        @Min(1)
        Integer genreId,

        @Size(max = 100)
        String genreName
) {
}
