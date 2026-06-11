package com.example.auth.dto.recent;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record SyncRecentlyViewedRequest(
        @Valid
        @NotNull
        @Size(max = 30)
        List<RecentlyViewedItemRequest> items
) {
}
