package com.example.auth.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "chat_messages")
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id", nullable = false)
    private Workspace workspace;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @Column(nullable = false, length = 4000)
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MessageType type = MessageType.TEXT;

    private LocalDateTime createdAt;

    public ChatMessage() {
    }

    public ChatMessage(Long id, Workspace workspace, User sender, String content, MessageType type, LocalDateTime createdAt) {
        this.id = id;
        this.workspace = workspace;
        this.sender = sender;
        this.content = content;
        this.type = type;
        this.createdAt = createdAt;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Getters
    public Long getId() { return id; }
    public Workspace getWorkspace() { return workspace; }
    public User getSender() { return sender; }
    public String getContent() { return content; }
    public MessageType getType() { return type; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setWorkspace(Workspace workspace) { this.workspace = workspace; }
    public void setSender(User sender) { this.sender = sender; }
    public void setContent(String content) { this.content = content; }
    public void setType(MessageType type) { this.type = type; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    // Builder pattern
    public static ChatMessageBuilder builder() {
        return new ChatMessageBuilder();
    }

    public static class ChatMessageBuilder {
        private Long id;
        private Workspace workspace;
        private User sender;
        private String content;
        private MessageType type = MessageType.TEXT;
        private LocalDateTime createdAt;

        public ChatMessageBuilder id(Long id) { this.id = id; return this; }
        public ChatMessageBuilder workspace(Workspace workspace) { this.workspace = workspace; return this; }
        public ChatMessageBuilder sender(User sender) { this.sender = sender; return this; }
        public ChatMessageBuilder content(String content) { this.content = content; return this; }
        public ChatMessageBuilder type(MessageType type) { this.type = type; return this; }
        public ChatMessageBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public ChatMessage build() {
            return new ChatMessage(id, workspace, sender, content, type, createdAt);
        }
    }
}
