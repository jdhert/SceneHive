package com.example.auth.service;

import com.example.auth.dto.favorite.FavoriteRequest;
import com.example.auth.dto.favorite.FavoriteResponse;
import com.example.auth.entity.Favorite;
import com.example.auth.entity.FavoriteType;
import com.example.auth.entity.User;
import com.example.auth.exception.CustomException;
import com.example.auth.identity.IdentityReader;
import com.example.auth.repository.FavoriteRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class FavoriteService {

    private final FavoriteRepository favoriteRepository;
    private final IdentityReader identityReader;

    public FavoriteService(FavoriteRepository favoriteRepository, IdentityReader identityReader) {
        this.favoriteRepository = favoriteRepository;
        this.identityReader = identityReader;
    }

    @Transactional
    public FavoriteResponse addFavorite(String userEmail, FavoriteRequest request) {
        User user = findUserByEmail(userEmail);

        Favorite favorite = favoriteRepository
                .findByUserIdAndTargetTypeAndTargetId(user.getId(), request.targetType(), request.targetId())
                .orElseGet(() -> favoriteRepository.save(
                        Favorite.builder()
                                .user(user)
                                .targetType(request.targetType())
                                .targetId(request.targetId())
                                .displayName(request.displayName())
                                .imagePath(request.imagePath())
                                .build()
                ));

        return FavoriteResponse.from(favorite);
    }

    @Transactional(readOnly = true)
    public List<FavoriteResponse> getFavorites(String userEmail, FavoriteType type) {
        User user = findUserByEmail(userEmail);
        List<Favorite> favorites = type == null
                ? favoriteRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                : favoriteRepository.findByUserIdAndTargetTypeOrderByCreatedAtDesc(user.getId(), type);

        return favorites.stream()
                .map(FavoriteResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public boolean existsFavorite(String userEmail, FavoriteType type, Long targetId) {
        User user = findUserByEmail(userEmail);
        return favoriteRepository.existsByUserIdAndTargetTypeAndTargetId(user.getId(), type, targetId);
    }

    @Transactional
    public void removeFavorite(String userEmail, FavoriteType type, Long targetId) {
        User user = findUserByEmail(userEmail);
        long deleted = favoriteRepository.deleteByUserIdAndTargetTypeAndTargetId(user.getId(), type, targetId);
        if (deleted == 0) {
            throw new CustomException("즐겨찾기 항목을 찾을 수 없습니다.", HttpStatus.NOT_FOUND);
        }
    }

    private User findUserByEmail(String email) {
        return identityReader.requireUserByEmail(email);
    }
}
