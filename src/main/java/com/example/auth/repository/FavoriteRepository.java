package com.example.auth.repository;

import com.example.auth.entity.Favorite;
import com.example.auth.entity.FavoriteType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FavoriteRepository extends JpaRepository<Favorite, Long> {

    Optional<Favorite> findByUserIdAndTargetTypeAndTargetId(Long userId, FavoriteType targetType, Long targetId);

    boolean existsByUserIdAndTargetTypeAndTargetId(Long userId, FavoriteType targetType, Long targetId);

    List<Favorite> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Favorite> findByUserIdAndTargetTypeOrderByCreatedAtDesc(Long userId, FavoriteType targetType);

    long deleteByUserIdAndTargetTypeAndTargetId(Long userId, FavoriteType targetType, Long targetId);
}

