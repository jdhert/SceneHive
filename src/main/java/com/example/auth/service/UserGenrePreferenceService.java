package com.example.auth.service;

import com.example.auth.dto.genre.GenrePreferenceItemRequest;
import com.example.auth.dto.genre.GenrePreferenceResponse;
import com.example.auth.dto.genre.UpdateGenrePreferencesRequest;
import com.example.auth.dto.genre.UserGenrePreferencesResponse;
import com.example.auth.entity.GenrePreferenceMediaType;
import com.example.auth.entity.User;
import com.example.auth.entity.UserGenrePreference;
import com.example.auth.identity.IdentityReader;
import com.example.auth.repository.UserGenrePreferenceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class UserGenrePreferenceService {

    private final UserGenrePreferenceRepository preferenceRepository;
    private final IdentityReader identityReader;

    public UserGenrePreferenceService(UserGenrePreferenceRepository preferenceRepository,
                                      IdentityReader identityReader) {
        this.preferenceRepository = preferenceRepository;
        this.identityReader = identityReader;
    }

    @Transactional(readOnly = true)
    public UserGenrePreferencesResponse getPreferences(String userEmail) {
        User user = identityReader.requireUserByEmail(userEmail);
        return buildResponse(user.getId());
    }

    @Transactional
    public UserGenrePreferencesResponse replacePreferences(String userEmail,
                                                           UpdateGenrePreferencesRequest request) {
        User user = identityReader.requireUserByEmail(userEmail);
        GenrePreferenceMediaType mediaType = request.mediaType();
        List<GenrePreferenceItemRequest> normalizedGenres = normalize(request.genres());

        preferenceRepository.deleteByUserIdAndMediaType(user.getId(), mediaType);

        for (int i = 0; i < normalizedGenres.size(); i++) {
            GenrePreferenceItemRequest item = normalizedGenres.get(i);
            preferenceRepository.save(UserGenrePreference.builder()
                    .user(user)
                    .mediaType(mediaType)
                    .genreId(item.genreId())
                    .genreName(normalizeName(item.genreName()))
                    .priority(i)
                    .build());
        }

        return buildResponse(user.getId());
    }

    private List<GenrePreferenceItemRequest> normalize(List<GenrePreferenceItemRequest> genres) {
        Map<Integer, GenrePreferenceItemRequest> deduplicated = new LinkedHashMap<>();

        for (GenrePreferenceItemRequest genre : genres) {
            if (genre == null || genre.genreId() == null || genre.genreId() <= 0) {
                continue;
            }
            deduplicated.putIfAbsent(genre.genreId(), genre);
        }

        return deduplicated.values().stream().toList();
    }

    private UserGenrePreferencesResponse buildResponse(Long userId) {
        List<GenrePreferenceResponse> preferences = preferenceRepository
                .findByUserIdOrderByMediaTypeAscPriorityAscIdAsc(userId)
                .stream()
                .map(GenrePreferenceResponse::from)
                .toList();

        return new UserGenrePreferencesResponse(preferences);
    }

    private String normalizeName(String genreName) {
        if (genreName == null || genreName.isBlank()) {
            return null;
        }
        return genreName.trim();
    }
}
