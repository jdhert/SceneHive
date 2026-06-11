package com.example.auth.repository;

import com.example.auth.entity.FavoriteType;
import com.example.auth.entity.RecentlyViewedContent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RecentlyViewedContentRepository extends JpaRepository<RecentlyViewedContent, Long> {

    Optional<RecentlyViewedContent> findByUserIdAndTargetTypeAndTargetId(
            Long userId,
            FavoriteType targetType,
            Long targetId
    );

    List<RecentlyViewedContent> findByUserIdOrderByViewedAtDescIdDesc(Long userId);
}
