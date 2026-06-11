package com.example.auth.dto.recent;

import com.example.auth.entity.FavoriteType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.OffsetDateTime;
import java.util.List;

public record RecentlyViewedItemRequest(
        @NotNull FavoriteType targetType,
        @NotNull @Positive Long targetId,
        @NotBlank @Size(max = 200) String displayName,
        @Size(max = 500) String imagePath,
        @Size(max = 20) List<@Positive Integer> genreIds,
        @Size(max = 200) String subtitle,
        @NotBlank @Size(max = 500) String href,
        OffsetDateTime viewedAt
) {
}
