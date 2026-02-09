package com.example.auth.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "code_snippets")
public class CodeSnippet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id", nullable = false)
    private Workspace workspace;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String code;

    @Column(nullable = false, length = 50)
    private String language;

    @Column(length = 500)
    private String description;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    public CodeSnippet() {
    }

    public CodeSnippet(Long id, Workspace workspace, User author, String title, String code, String language, String description, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.workspace = workspace;
        this.author = author;
        this.title = title;
        this.code = code;
        this.language = language;
        this.description = description;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
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
    public Workspace getWorkspace() { return workspace; }
    public User getAuthor() { return author; }
    public String getTitle() { return title; }
    public String getCode() { return code; }
    public String getLanguage() { return language; }
    public String getDescription() { return description; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setWorkspace(Workspace workspace) { this.workspace = workspace; }
    public void setAuthor(User author) { this.author = author; }
    public void setTitle(String title) { this.title = title; }
    public void setCode(String code) { this.code = code; }
    public void setLanguage(String language) { this.language = language; }
    public void setDescription(String description) { this.description = description; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    // Builder pattern
    public static CodeSnippetBuilder builder() {
        return new CodeSnippetBuilder();
    }

    public static class CodeSnippetBuilder {
        private Long id;
        private Workspace workspace;
        private User author;
        private String title;
        private String code;
        private String language;
        private String description;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public CodeSnippetBuilder id(Long id) { this.id = id; return this; }
        public CodeSnippetBuilder workspace(Workspace workspace) { this.workspace = workspace; return this; }
        public CodeSnippetBuilder author(User author) { this.author = author; return this; }
        public CodeSnippetBuilder title(String title) { this.title = title; return this; }
        public CodeSnippetBuilder code(String code) { this.code = code; return this; }
        public CodeSnippetBuilder language(String language) { this.language = language; return this; }
        public CodeSnippetBuilder description(String description) { this.description = description; return this; }
        public CodeSnippetBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public CodeSnippetBuilder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }

        public CodeSnippet build() {
            return new CodeSnippet(id, workspace, author, title, code, language, description, createdAt, updatedAt);
        }
    }
}
