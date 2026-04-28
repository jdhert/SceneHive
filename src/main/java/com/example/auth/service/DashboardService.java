package com.example.auth.service;

import com.example.auth.dto.chat.ChatMessageResponse;
import com.example.auth.dto.dashboard.DashboardResponse;
import com.example.auth.dto.memo.MemoResponse;
import com.example.auth.dto.snippet.SnippetResponse;
import com.example.auth.dto.workspace.WorkspaceResponse;
import com.example.auth.entity.User;
import com.example.auth.identity.IdentityReader;
import com.example.auth.repository.*;
import com.example.auth.workspace.WorkspaceAccessChecker;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;

@Service
public class DashboardService {

    private final IdentityReader identityReader;
    private final WorkspaceAccessChecker workspaceAccessChecker;
    private final ChatMessageRepository chatMessageRepository;
    private final CodeSnippetRepository snippetRepository;
    private final MemoRepository memoRepository;

    public DashboardService(IdentityReader identityReader,
                            WorkspaceAccessChecker workspaceAccessChecker,
                            ChatMessageRepository chatMessageRepository,
                            CodeSnippetRepository snippetRepository,
                            MemoRepository memoRepository) {
        this.identityReader = identityReader;
        this.workspaceAccessChecker = workspaceAccessChecker;
        this.chatMessageRepository = chatMessageRepository;
        this.snippetRepository = snippetRepository;
        this.memoRepository = memoRepository;
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

        PageRequest pageRequest = PageRequest.of(0, limit);

        List<ChatMessageResponse> recentMessages = chatMessageRepository
                .findRecentByWorkspaceIds(workspaceIds, pageRequest)
                .map(ChatMessageResponse::from)
                .getContent();

        List<SnippetResponse> recentSnippets = snippetRepository
                .findRecentByWorkspaceIds(workspaceIds, pageRequest)
                .map(SnippetResponse::from)
                .getContent();

        List<MemoResponse> recentMemos = memoRepository
                .findRecentByWorkspaceIds(workspaceIds, pageRequest)
                .map(MemoResponse::from)
                .getContent();

        return new DashboardResponse(workspaces, recentMessages, recentSnippets, recentMemos);
    }
}
