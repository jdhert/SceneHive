package com.example.auth.service;

import com.example.auth.dto.chat.ChatMessageResponse;
import com.example.auth.dto.dashboard.DashboardResponse;
import com.example.auth.dto.memo.MemoResponse;
import com.example.auth.dto.snippet.SnippetResponse;
import com.example.auth.dto.workspace.WorkspaceResponse;
import com.example.auth.entity.User;
import com.example.auth.exception.CustomException;
import com.example.auth.repository.*;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;

@Service
public class DashboardService {

    private final UserRepository userRepository;
    private final WorkspaceMemberRepository memberRepository;
    private final WorkspaceRepository workspaceRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final CodeSnippetRepository snippetRepository;
    private final MemoRepository memoRepository;

    public DashboardService(UserRepository userRepository,
                            WorkspaceMemberRepository memberRepository,
                            WorkspaceRepository workspaceRepository,
                            ChatMessageRepository chatMessageRepository,
                            CodeSnippetRepository snippetRepository,
                            MemoRepository memoRepository) {
        this.userRepository = userRepository;
        this.memberRepository = memberRepository;
        this.workspaceRepository = workspaceRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.snippetRepository = snippetRepository;
        this.memoRepository = memoRepository;
    }

    @Transactional(readOnly = true)
    public DashboardResponse getDashboard(String userEmail, int limit) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다.", HttpStatus.NOT_FOUND));

        List<Long> workspaceIds = memberRepository.findWorkspaceIdsByUserId(user.getId());

        List<WorkspaceResponse> workspaces = workspaceRepository.findAllById(workspaceIds)
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
