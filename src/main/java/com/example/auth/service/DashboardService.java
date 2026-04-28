package com.example.auth.service;

import com.example.auth.chat.ChatQueryReader;
import com.example.auth.content.ContentQueryReader;
import com.example.auth.dto.chat.ChatMessageResponse;
import com.example.auth.dto.dashboard.DashboardResponse;
import com.example.auth.dto.memo.MemoResponse;
import com.example.auth.dto.snippet.SnippetResponse;
import com.example.auth.dto.workspace.WorkspaceResponse;
import com.example.auth.entity.User;
import com.example.auth.identity.IdentityReader;
import com.example.auth.workspace.WorkspaceAccessChecker;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;

@Service
public class DashboardService {

    private final IdentityReader identityReader;
    private final WorkspaceAccessChecker workspaceAccessChecker;
    private final ChatQueryReader chatQueryReader;
    private final ContentQueryReader contentQueryReader;

    public DashboardService(IdentityReader identityReader,
                            WorkspaceAccessChecker workspaceAccessChecker,
                            ChatQueryReader chatQueryReader,
                            ContentQueryReader contentQueryReader) {
        this.identityReader = identityReader;
        this.workspaceAccessChecker = workspaceAccessChecker;
        this.chatQueryReader = chatQueryReader;
        this.contentQueryReader = contentQueryReader;
    }

    @Transactional(readOnly = true)
    public DashboardResponse getDashboard(String userEmail, int limit) {
        User user = identityReader.requireUserByEmail(userEmail);

        List<Long> workspaceIds = workspaceAccessChecker.findWorkspaceIdsForUser(user.getId());

        List<WorkspaceResponse> workspaces = workspaceAccessChecker.findWorkspacesByIds(workspaceIds)
                .stream()
                .map(WorkspaceResponse::simpleFrom)
                .toList();

        if (workspaceIds.isEmpty()) {
            return new DashboardResponse(workspaces, Collections.emptyList(), Collections.emptyList(), Collections.emptyList());
        }

        List<ChatMessageResponse> recentMessages = chatQueryReader.findRecentMessages(workspaceIds, limit);
        List<SnippetResponse> recentSnippets = contentQueryReader.findRecentSnippets(workspaceIds, limit);
        List<MemoResponse> recentMemos = contentQueryReader.findRecentMemos(workspaceIds, limit);

        return new DashboardResponse(workspaces, recentMessages, recentSnippets, recentMemos);
    }
}
