package com.example.auth.controller;

import com.example.auth.dto.favorite.FavoriteRequest;
import com.example.auth.dto.favorite.FavoriteResponse;
import com.example.auth.entity.FavoriteType;
import com.example.auth.service.FavoriteService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/favorites")
public class FavoriteController {

    private final FavoriteService favoriteService;

    public FavoriteController(FavoriteService favoriteService) {
        this.favoriteService = favoriteService;
    }

    @PostMapping
    public ResponseEntity<FavoriteResponse> addFavorite(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody FavoriteRequest request) {
        return ResponseEntity.ok(favoriteService.addFavorite(userDetails.getUsername(), request));
    }

    @GetMapping
    public ResponseEntity<List<FavoriteResponse>> getFavorites(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) FavoriteType type) {
        return ResponseEntity.ok(favoriteService.getFavorites(userDetails.getUsername(), type));
    }

    @GetMapping("/exists")
    public ResponseEntity<Map<String, Boolean>> existsFavorite(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam FavoriteType type,
            @RequestParam Long targetId) {
        boolean exists = favoriteService.existsFavorite(userDetails.getUsername(), type, targetId);
        return ResponseEntity.ok(Map.of("exists", exists));
    }

    @DeleteMapping
    public ResponseEntity<Void> removeFavorite(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam FavoriteType type,
            @RequestParam Long targetId) {
        favoriteService.removeFavorite(userDetails.getUsername(), type, targetId);
        return ResponseEntity.noContent().build();
    }
}

