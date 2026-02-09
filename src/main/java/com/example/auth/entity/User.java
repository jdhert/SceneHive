package com.example.auth.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    private Role role = Role.USER;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @Column(nullable = false)
    private boolean isVerified = false;

    // Profile fields
    private String profilePictureUrl;

    @Column(length = 500)
    private String bio;

    @Column(length = 100)
    private String jobTitle;

    @Column(length = 100)
    private String company;

    @Enumerated(EnumType.STRING)
    private UserStatus status = UserStatus.OFFLINE;

    private LocalDateTime lastSeenAt;

    // Account lockout fields
    @Column(nullable = false, columnDefinition = "integer default 0")
    private int failedLoginAttempts = 0;

    private LocalDateTime accountLockedUntil;

    public User() {
    }

    public User(Long id, String email, String password, String name, Role role,
                LocalDateTime createdAt, LocalDateTime updatedAt, boolean isVerified,
                String profilePictureUrl, String bio, String jobTitle, String company,
                UserStatus status, LocalDateTime lastSeenAt,
                int failedLoginAttempts, LocalDateTime accountLockedUntil) {
        this.id = id;
        this.email = email;
        this.password = password;
        this.name = name;
        this.role = role;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.isVerified = isVerified;
        this.profilePictureUrl = profilePictureUrl;
        this.bio = bio;
        this.jobTitle = jobTitle;
        this.company = company;
        this.status = status;
        this.lastSeenAt = lastSeenAt;
        this.failedLoginAttempts = failedLoginAttempts;
        this.accountLockedUntil = accountLockedUntil;
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
    public String getEmail() { return email; }
    public String getPassword() { return password; }
    public String getName() { return name; }
    public Role getRole() { return role; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public boolean isVerified() { return isVerified; }
    public String getProfilePictureUrl() { return profilePictureUrl; }
    public String getBio() { return bio; }
    public String getJobTitle() { return jobTitle; }
    public String getCompany() { return company; }
    public UserStatus getStatus() { return status; }
    public LocalDateTime getLastSeenAt() { return lastSeenAt; }
    public int getFailedLoginAttempts() { return failedLoginAttempts; }
    public LocalDateTime getAccountLockedUntil() { return accountLockedUntil; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setEmail(String email) { this.email = email; }
    public void setPassword(String password) { this.password = password; }
    public void setName(String name) { this.name = name; }
    public void setRole(Role role) { this.role = role; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public void setVerified(boolean isVerified) { this.isVerified = isVerified; }
    public void setProfilePictureUrl(String profilePictureUrl) { this.profilePictureUrl = profilePictureUrl; }
    public void setBio(String bio) { this.bio = bio; }
    public void setJobTitle(String jobTitle) { this.jobTitle = jobTitle; }
    public void setCompany(String company) { this.company = company; }
    public void setStatus(UserStatus status) { this.status = status; }
    public void setLastSeenAt(LocalDateTime lastSeenAt) { this.lastSeenAt = lastSeenAt; }
    public void setFailedLoginAttempts(int failedLoginAttempts) { this.failedLoginAttempts = failedLoginAttempts; }
    public void setAccountLockedUntil(LocalDateTime accountLockedUntil) { this.accountLockedUntil = accountLockedUntil; }

    // Builder pattern
    public static UserBuilder builder() {
        return new UserBuilder();
    }

    public static class UserBuilder {
        private Long id;
        private String email;
        private String password;
        private String name;
        private Role role = Role.USER;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private boolean isVerified = false;
        private String profilePictureUrl;
        private String bio;
        private String jobTitle;
        private String company;
        private UserStatus status = UserStatus.OFFLINE;
        private LocalDateTime lastSeenAt;
        private int failedLoginAttempts = 0;
        private LocalDateTime accountLockedUntil;

        public UserBuilder id(Long id) { this.id = id; return this; }
        public UserBuilder email(String email) { this.email = email; return this; }
        public UserBuilder password(String password) { this.password = password; return this; }
        public UserBuilder name(String name) { this.name = name; return this; }
        public UserBuilder role(Role role) { this.role = role; return this; }
        public UserBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public UserBuilder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }
        public UserBuilder isVerified(boolean isVerified) { this.isVerified = isVerified; return this; }
        public UserBuilder profilePictureUrl(String profilePictureUrl) { this.profilePictureUrl = profilePictureUrl; return this; }
        public UserBuilder bio(String bio) { this.bio = bio; return this; }
        public UserBuilder jobTitle(String jobTitle) { this.jobTitle = jobTitle; return this; }
        public UserBuilder company(String company) { this.company = company; return this; }
        public UserBuilder status(UserStatus status) { this.status = status; return this; }
        public UserBuilder lastSeenAt(LocalDateTime lastSeenAt) { this.lastSeenAt = lastSeenAt; return this; }
        public UserBuilder failedLoginAttempts(int failedLoginAttempts) { this.failedLoginAttempts = failedLoginAttempts; return this; }
        public UserBuilder accountLockedUntil(LocalDateTime accountLockedUntil) { this.accountLockedUntil = accountLockedUntil; return this; }

        public User build() {
            return new User(id, email, password, name, role, createdAt, updatedAt, isVerified,
                    profilePictureUrl, bio, jobTitle, company, status, lastSeenAt,
                    failedLoginAttempts, accountLockedUntil);
        }
    }
}
