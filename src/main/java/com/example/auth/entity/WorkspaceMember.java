package com.example.auth.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "workspace_members",
       uniqueConstraints = @UniqueConstraint(columnNames = {"workspace_id", "user_id"}))
public class WorkspaceMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id", nullable = false)
    private Workspace workspace;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private WorkspaceRole role = WorkspaceRole.MEMBER;

    private LocalDateTime joinedAt;

    public WorkspaceMember() {
    }

    public WorkspaceMember(Long id, Workspace workspace, User user, WorkspaceRole role, LocalDateTime joinedAt) {
        this.id = id;
        this.workspace = workspace;
        this.user = user;
        this.role = role;
        this.joinedAt = joinedAt;
    }

    @PrePersist
    protected void onCreate() {
        joinedAt = LocalDateTime.now();
    }

    // Getters
    public Long getId() { return id; }
    public Workspace getWorkspace() { return workspace; }
    public User getUser() { return user; }
    public WorkspaceRole getRole() { return role; }
    public LocalDateTime getJoinedAt() { return joinedAt; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setWorkspace(Workspace workspace) { this.workspace = workspace; }
    public void setUser(User user) { this.user = user; }
    public void setRole(WorkspaceRole role) { this.role = role; }
    public void setJoinedAt(LocalDateTime joinedAt) { this.joinedAt = joinedAt; }

    // Builder pattern
    public static WorkspaceMemberBuilder builder() {
        return new WorkspaceMemberBuilder();
    }

    public static class WorkspaceMemberBuilder {
        private Long id;
        private Workspace workspace;
        private User user;
        private WorkspaceRole role = WorkspaceRole.MEMBER;
        private LocalDateTime joinedAt;

        public WorkspaceMemberBuilder id(Long id) { this.id = id; return this; }
        public WorkspaceMemberBuilder workspace(Workspace workspace) { this.workspace = workspace; return this; }
        public WorkspaceMemberBuilder user(User user) { this.user = user; return this; }
        public WorkspaceMemberBuilder role(WorkspaceRole role) { this.role = role; return this; }
        public WorkspaceMemberBuilder joinedAt(LocalDateTime joinedAt) { this.joinedAt = joinedAt; return this; }

        public WorkspaceMember build() {
            return new WorkspaceMember(id, workspace, user, role, joinedAt);
        }
    }
}
