package com.example.auth.dto.recent;

import com.example.auth.entity.FavoriteType;
import com.example.auth.entity.RecentlyViewedContent;

import java.time.LocalDateTime;
import java.util.List;

public record RecentlyViewedResponse(
        Long id,
        FavoriteType targetType,
        Long targetId,
        String displayName,
        String imagePath,
        List<Integer> genreIds,
        String subtitle,
        String href,
        LocalDateTime viewedAt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static RecentlyViewedResponse from(RecentlyViewedContent content) {
        return new RecentlyViewedResponse(
                content.getId(),
                content.getTargetType(),
                content.getTargetId(),
                content.getDisplayName(),
                content.getImagePath(),
                List.copyOf(content.getGenreIds()),
                content.getSubtitle(),
                content.getHref(),
                content.getViewedAt(),
                content.getCreatedAt(),
                content.getUpdatedAt()
        );
    }
}
