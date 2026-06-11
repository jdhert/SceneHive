package com.example.auth.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_genre_preferences",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_user_genre_preference",
                        columnNames = {"user_id", "media_type", "genre_id"}
                )
        },
        indexes = {
                @Index(name = "idx_user_genre_preference_user_media", columnList = "user_id, media_type, priority")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserGenrePreference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "media_type", nullable = false, length = 20)
    private GenrePreferenceMediaType mediaType;

    @Column(name = "genre_id", nullable = false)
    private Integer genreId;

    @Column(name = "genre_name", length = 100)
    private String genreName;

    @Column(nullable = false)
    private Integer priority;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
