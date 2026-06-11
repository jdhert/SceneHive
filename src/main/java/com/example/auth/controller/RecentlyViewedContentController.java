package com.example.auth.controller;

import com.example.auth.dto.recent.RecentlyViewedItemRequest;
import com.example.auth.dto.recent.RecentlyViewedResponse;
import com.example.auth.dto.recent.SyncRecentlyViewedRequest;
import com.example.auth.service.RecentlyViewedContentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/users/me/recently-viewed")
public class RecentlyViewedContentController {

    private final RecentlyViewedContentService recentlyViewedService;

    public RecentlyViewedContentController(RecentlyViewedContentService recentlyViewedService) {
        this.recentlyViewedService = recentlyViewedService;
    }

    @GetMapping
    public ResponseEntity<List<RecentlyViewedResponse>> getRecentlyViewed(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "12") int limit) {
        return ResponseEntity.ok(recentlyViewedService.getRecentlyViewed(userDetails.getUsername(), limit));
    }

    @PostMapping
    public ResponseEntity<RecentlyViewedResponse> record(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody RecentlyViewedItemRequest request) {
        return ResponseEntity.ok(recentlyViewedService.record(userDetails.getUsername(), request));
    }

    @PutMapping
    public ResponseEntity<List<RecentlyViewedResponse>> sync(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody SyncRecentlyViewedRequest request) {
        return ResponseEntity.ok(recentlyViewedService.sync(userDetails.getUsername(), request));
    }
}
