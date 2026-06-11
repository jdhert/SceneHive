package com.example.auth.controller;

import com.example.auth.dto.genre.UpdateGenrePreferencesRequest;
import com.example.auth.dto.genre.UserGenrePreferencesResponse;
import com.example.auth.service.UserGenrePreferenceService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users/me/genre-preferences")
public class UserGenrePreferenceController {

    private final UserGenrePreferenceService preferenceService;

    public UserGenrePreferenceController(UserGenrePreferenceService preferenceService) {
        this.preferenceService = preferenceService;
    }

    @GetMapping
    public ResponseEntity<UserGenrePreferencesResponse> getPreferences(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(preferenceService.getPreferences(userDetails.getUsername()));
    }

    @PutMapping
    public ResponseEntity<UserGenrePreferencesResponse> replacePreferences(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UpdateGenrePreferencesRequest request) {
        return ResponseEntity.ok(preferenceService.replacePreferences(userDetails.getUsername(), request));
    }
}
