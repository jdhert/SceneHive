package com.example.auth.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "workspaces")
public class Workspace {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 500)
    private String description;

    @Column(unique = true, nullable = false)
    private String inviteCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @OneToMany(mappedBy = "workspace", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<WorkspaceMember> members = new ArrayList<>();

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    public Workspace() {
    }

    public Workspace(Long id, String name, String description, String inviteCode, User owner, List<WorkspaceMember> members, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.inviteCode = inviteCode;
        this.owner = owner;
        this.members = members != null ? members : new ArrayList<>();
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (inviteCode == null) {
            inviteCode = UUID.randomUUID().toString();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Getters
    public Long getId() { return id; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public String getInviteCode() { return inviteCode; }
    public User getOwner() { return owner; }
    public List<WorkspaceMember> getMembers() { return members; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setName(String name) { this.name = name; }
    public void setDescription(String description) { this.description = description; }
    public void setInviteCode(String inviteCode) { this.inviteCode = inviteCode; }
    public void setOwner(User owner) { this.owner = owner; }
    public void setMembers(List<WorkspaceMember> members) { this.members = members; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    // Helper methods
    public void addMember(WorkspaceMember member) {
        members.add(member);
        member.setWorkspace(this);
    }

    public void removeMember(WorkspaceMember member) {
        members.remove(member);
        member.setWorkspace(null);
    }

    // Builder pattern
    public static WorkspaceBuilder builder() {
        return new WorkspaceBuilder();
    }

    public static class WorkspaceBuilder {
        private Long id;
        private String name;
        private String description;
        private String inviteCode;
        private User owner;
        private List<WorkspaceMember> members = new ArrayList<>();
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public WorkspaceBuilder id(Long id) { this.id = id; return this; }
        public WorkspaceBuilder name(String name) { this.name = name; return this; }
        public WorkspaceBuilder description(String description) { this.description = description; return this; }
        public WorkspaceBuilder inviteCode(String inviteCode) { this.inviteCode = inviteCode; return this; }
        public WorkspaceBuilder owner(User owner) { this.owner = owner; return this; }
        public WorkspaceBuilder members(List<WorkspaceMember> members) { this.members = members; return this; }
        public WorkspaceBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public WorkspaceBuilder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }

        public Workspace build() {
            return new Workspace(id, name, description, inviteCode, owner, members, createdAt, updatedAt);
        }
    }
}
