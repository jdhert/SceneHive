package com.example.auth.service;

import com.example.auth.dto.recent.RecentlyViewedItemRequest;
import com.example.auth.dto.recent.RecentlyViewedResponse;
import com.example.auth.dto.recent.SyncRecentlyViewedRequest;
import com.example.auth.entity.RecentlyViewedContent;
import com.example.auth.entity.User;
import com.example.auth.identity.IdentityReader;
import com.example.auth.repository.RecentlyViewedContentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class RecentlyViewedContentService {

    private static final int MAX_RECENT_ITEMS = 18;
    private static final int MAX_GENRE_IDS = 20;

    private final RecentlyViewedContentRepository recentlyViewedRepository;
    private final IdentityReader identityReader;

    public RecentlyViewedContentService(RecentlyViewedContentRepository recentlyViewedRepository,
                                        IdentityReader identityReader) {
        this.recentlyViewedRepository = recentlyViewedRepository;
        this.identityReader = identityReader;
    }

    @Transactional(readOnly = true)
    public List<RecentlyViewedResponse> getRecentlyViewed(String userEmail, int limit) {
        User user = identityReader.requireUserByEmail(userEmail);
        return recentlyViewedRepository.findByUserIdOrderByViewedAtDescIdDesc(user.getId())
                .stream()
                .limit(normalizeLimit(limit))
                .map(RecentlyViewedResponse::from)
                .toList();
    }

    @Transactional
    public RecentlyViewedResponse record(String userEmail, RecentlyViewedItemRequest request) {
        User user = identityReader.requireUserByEmail(userEmail);
        RecentlyViewedContent content = upsert(user, request);
        trimHistory(user.getId());
        return RecentlyViewedResponse.from(content);
    }

    @Transactional
    public List<RecentlyViewedResponse> sync(String userEmail, SyncRecentlyViewedRequest request) {
        User user = identityReader.requireUserByEmail(userEmail);

        for (RecentlyViewedItemRequest item : normalizeItems(request.items())) {
            upsert(user, item);
        }

        trimHistory(user.getId());
        return recentlyViewedRepository.findByUserIdOrderByViewedAtDescIdDesc(user.getId())
                .stream()
                .limit(MAX_RECENT_ITEMS)
                .map(RecentlyViewedResponse::from)
                .toList();
    }

    private RecentlyViewedContent upsert(User user, RecentlyViewedItemRequest request) {
        LocalDateTime requestedViewedAt = resolveViewedAt(request);
        RecentlyViewedContent content = recentlyViewedRepository
                .findByUserIdAndTargetTypeAndTargetId(user.getId(), request.targetType(), request.targetId())
                .orElseGet(() -> RecentlyViewedContent.builder()
                        .user(user)
                        .targetType(request.targetType())
                        .targetId(request.targetId())
                        .build());

        content.setDisplayName(request.displayName().trim());
        content.setImagePath(normalizeText(request.imagePath()));
        content.setSubtitle(normalizeText(request.subtitle()));
        content.setHref(request.href().trim());

        if (content.getViewedAt() == null || requestedViewedAt.isAfter(content.getViewedAt())) {
            content.setViewedAt(requestedViewedAt);
        }

        content.getGenreIds().clear();
        content.getGenreIds().addAll(normalizeGenreIds(request.genreIds()));

        return recentlyViewedRepository.save(content);
    }

    private List<RecentlyViewedItemRequest> normalizeItems(List<RecentlyViewedItemRequest> items) {
        Map<String, RecentlyViewedItemRequest> deduplicated = new LinkedHashMap<>();

        for (RecentlyViewedItemRequest item : items) {
            String key = item.targetType() + ":" + item.targetId();
            RecentlyViewedItemRequest existing = deduplicated.get(key);
            if (existing == null || resolveViewedAt(item).isAfter(resolveViewedAt(existing))) {
                deduplicated.put(key, item);
            }
        }

        return deduplicated.values()
                .stream()
                .sorted(Comparator.comparing(this::resolveViewedAt).reversed())
                .limit(MAX_RECENT_ITEMS)
                .toList();
    }

    private List<Integer> normalizeGenreIds(List<Integer> genreIds) {
        if (genreIds == null) {
            return List.of();
        }

        return genreIds.stream()
                .filter(genreId -> genreId != null && genreId > 0)
                .distinct()
                .limit(MAX_GENRE_IDS)
                .toList();
    }

    private void trimHistory(Long userId) {
        List<RecentlyViewedContent> allItems = recentlyViewedRepository.findByUserIdOrderByViewedAtDescIdDesc(userId);
        if (allItems.size() <= MAX_RECENT_ITEMS) {
            return;
        }

        recentlyViewedRepository.deleteAll(allItems.subList(MAX_RECENT_ITEMS, allItems.size()));
    }

    private LocalDateTime resolveViewedAt(RecentlyViewedItemRequest request) {
        LocalDateTime now = LocalDateTime.now();
        if (request.viewedAt() == null) {
            return now;
        }

        LocalDateTime viewedAt = request.viewedAt().toLocalDateTime();
        if (viewedAt.isAfter(now.plusMinutes(5))) {
            return now;
        }

        return viewedAt;
    }

    private int normalizeLimit(int limit) {
        if (limit <= 0) {
            return 12;
        }
        return Math.min(limit, MAX_RECENT_ITEMS);
    }

    private String normalizeText(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
