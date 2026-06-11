package com.example.auth.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "recently_viewed_contents",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_recently_viewed_user_target",
                        columnNames = {"user_id", "target_type", "target_id"}
                )
        },
        indexes = {
                @Index(name = "idx_recently_viewed_user_viewed", columnList = "user_id, viewed_at"),
                @Index(name = "idx_recently_viewed_target", columnList = "target_type, target_id")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecentlyViewedContent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", nullable = false, length = 20)
    private FavoriteType targetType;

    @Column(name = "target_id", nullable = false)
    private Long targetId;

    @Column(name = "display_name", nullable = false, length = 200)
    private String displayName;

    @Column(name = "image_path", length = 500)
    private String imagePath;

    @ElementCollection
    @CollectionTable(
            name = "recently_viewed_content_genres",
            joinColumns = @JoinColumn(name = "recently_viewed_content_id")
    )
    @OrderColumn(name = "genre_order")
    @Column(name = "genre_id", nullable = false)
    @Builder.Default
    private List<Integer> genreIds = new ArrayList<>();

    @Column(length = 200)
    private String subtitle;

    @Column(nullable = false, length = 500)
    private String href;

    @Column(name = "viewed_at", nullable = false)
    private LocalDateTime viewedAt;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (viewedAt == null) {
            viewedAt = now;
        }
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
