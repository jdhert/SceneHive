package com.example.auth.dto.favorite;

import com.example.auth.entity.FavoriteType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record FavoriteRequest(
        @NotNull FavoriteType targetType,
        @NotNull Long targetId,
        @NotBlank @Size(max = 200) String displayName,
        @Size(max = 500) String imagePath
) {
}

