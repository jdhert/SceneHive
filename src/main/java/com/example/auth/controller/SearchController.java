package com.example.auth.controller;

import com.example.auth.dto.search.SearchResponse;
import com.example.auth.service.SearchService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/workspaces/{workspaceId}/search")
public class SearchController {

    private final SearchService searchService;

    public SearchController(SearchService searchService) {
        this.searchService = searchService;
    }

    @GetMapping
    public ResponseEntity<SearchResponse> search(
            @PathVariable Long workspaceId,
            @RequestParam String query,
            @RequestParam(defaultValue = "ALL") String type,
            @AuthenticationPrincipal UserDetails userDetails) {

        if (query == null || query.trim().length() < 2) {
            return ResponseEntity.badRequest().build();
        }

        SearchResponse response = searchService.search(workspaceId, query.trim(), type, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }
}
