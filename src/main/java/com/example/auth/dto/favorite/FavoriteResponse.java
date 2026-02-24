package com.example.auth.dto.favorite;

import com.example.auth.entity.Favorite;
import com.example.auth.entity.FavoriteType;

import java.time.LocalDateTime;

public record FavoriteResponse(
        Long id,
        FavoriteType targetType,
        Long targetId,
        String displayName,
        String imagePath,
        LocalDateTime createdAt
) {
    public static FavoriteResponse from(Favorite favorite) {
        return new FavoriteResponse(
                favorite.getId(),
                favorite.getTargetType(),
                favorite.getTargetId(),
                favorite.getDisplayName(),
                favorite.getImagePath(),
                favorite.getCreatedAt()
        );
    }
}

