package com.example.auth.service;

import com.example.auth.chat.ChatQueryReader;
import com.example.auth.content.ContentQueryReader;
import com.example.auth.dto.chat.ChatMessageResponse;
import com.example.auth.dto.memo.MemoResponse;
import com.example.auth.dto.search.SearchResponse;
import com.example.auth.dto.snippet.SnippetResponse;
import com.example.auth.entity.User;
import com.example.auth.identity.IdentityReader;
import com.example.auth.workspace.WorkspaceAccessChecker;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;

@Service
public class SearchService {

    private final ChatQueryReader chatQueryReader;
    private final ContentQueryReader contentQueryReader;
    private final WorkspaceAccessChecker workspaceAccessChecker;
    private final IdentityReader identityReader;

    public SearchService(ChatQueryReader chatQueryReader,
                        ContentQueryReader contentQueryReader,
                        WorkspaceAccessChecker workspaceAccessChecker,
                        IdentityReader identityReader) {
        this.chatQueryReader = chatQueryReader;
        this.contentQueryReader = contentQueryReader;
        this.workspaceAccessChecker = workspaceAccessChecker;
        this.identityReader = identityReader;
    }

    @Transactional(readOnly = true)
    public SearchResponse search(Long workspaceId, String keyword, String type, String email) {
        User user = identityReader.requireUserByEmail(email);
        workspaceAccessChecker.requireMember(workspaceId, user.getId());

        List<ChatMessageResponse> messages = Collections.emptyList();
        List<SnippetResponse> snippets = Collections.emptyList();
        List<MemoResponse> memos = Collections.emptyList();

        if ("ALL".equals(type) || "CHAT".equals(type)) {
            messages = chatQueryReader.searchMessages(workspaceId, keyword);
        }

        if ("ALL".equals(type) || "SNIPPET".equals(type)) {
            snippets = contentQueryReader.searchSnippets(workspaceId, keyword);
        }

        if ("ALL".equals(type) || "MEMO".equals(type)) {
            memos = contentQueryReader.searchMemos(workspaceId, keyword);
        }

        int totalCount = messages.size() + snippets.size() + memos.size();
        return new SearchResponse(messages, snippets, memos, totalCount);
    }
}
