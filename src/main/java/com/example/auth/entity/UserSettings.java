package com.example.auth.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_settings")
public class UserSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Theme theme = Theme.SYSTEM;

    @Column(nullable = false, length = 10)
    private String language = "ko";

    @Column(nullable = false)
    private boolean emailNotifications = true;

    @Column(nullable = false)
    private boolean pushNotifications = true;

    @Column(nullable = false)
    private boolean mentionNotifications = true;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    public UserSettings() {
    }

    public UserSettings(User user) {
        this.user = user;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Getters
    public Long getId() { return id; }
    public User getUser() { return user; }
    public Theme getTheme() { return theme; }
    public String getLanguage() { return language; }
    public boolean isEmailNotifications() { return emailNotifications; }
    public boolean isPushNotifications() { return pushNotifications; }
    public boolean isMentionNotifications() { return mentionNotifications; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setUser(User user) { this.user = user; }
    public void setTheme(Theme theme) { this.theme = theme; }
    public void setLanguage(String language) { this.language = language; }
    public void setEmailNotifications(boolean emailNotifications) { this.emailNotifications = emailNotifications; }
    public void setPushNotifications(boolean pushNotifications) { this.pushNotifications = pushNotifications; }
    public void setMentionNotifications(boolean mentionNotifications) { this.mentionNotifications = mentionNotifications; }

    // Builder
    public static UserSettingsBuilder builder() {
        return new UserSettingsBuilder();
    }

    public static class UserSettingsBuilder {
        private User user;
        private Theme theme = Theme.SYSTEM;
        private String language = "ko";
        private boolean emailNotifications = true;
        private boolean pushNotifications = true;
        private boolean mentionNotifications = true;

        public UserSettingsBuilder user(User user) { this.user = user; return this; }
        public UserSettingsBuilder theme(Theme theme) { this.theme = theme; return this; }
        public UserSettingsBuilder language(String language) { this.language = language; return this; }
        public UserSettingsBuilder emailNotifications(boolean emailNotifications) { this.emailNotifications = emailNotifications; return this; }
        public UserSettingsBuilder pushNotifications(boolean pushNotifications) { this.pushNotifications = pushNotifications; return this; }
        public UserSettingsBuilder mentionNotifications(boolean mentionNotifications) { this.mentionNotifications = mentionNotifications; return this; }

        public UserSettings build() {
            UserSettings settings = new UserSettings();
            settings.user = this.user;
            settings.theme = this.theme;
            settings.language = this.language;
            settings.emailNotifications = this.emailNotifications;
            settings.pushNotifications = this.pushNotifications;
            settings.mentionNotifications = this.mentionNotifications;
            return settings;
        }
    }
}
