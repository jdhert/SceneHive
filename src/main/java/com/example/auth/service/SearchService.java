package com.example.auth.service;

import com.example.auth.dto.chat.ChatMessageResponse;
import com.example.auth.dto.memo.MemoResponse;
import com.example.auth.dto.search.SearchResponse;
import com.example.auth.dto.snippet.SnippetResponse;
import com.example.auth.entity.User;
import com.example.auth.exception.CustomException;
import com.example.auth.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SearchService {

    private final ChatMessageRepository chatMessageRepository;
    private final CodeSnippetRepository codeSnippetRepository;
    private final MemoRepository memoRepository;
    private final WorkspaceMemberRepository memberRepository;
    private final UserRepository userRepository;

    public SearchService(ChatMessageRepository chatMessageRepository,
                        CodeSnippetRepository codeSnippetRepository,
                        MemoRepository memoRepository,
                        WorkspaceMemberRepository memberRepository,
                        UserRepository userRepository) {
        this.chatMessageRepository = chatMessageRepository;
        this.codeSnippetRepository = codeSnippetRepository;
        this.memoRepository = memoRepository;
        this.memberRepository = memberRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public SearchResponse search(Long workspaceId, String keyword, String type, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다", HttpStatus.NOT_FOUND));

        if (!memberRepository.existsByWorkspaceIdAndUserId(workspaceId, user.getId())) {
            throw new CustomException("워크스페이스에 접근 권한이 없습니다", HttpStatus.FORBIDDEN);
        }

        List<ChatMessageResponse> messages = Collections.emptyList();
        List<SnippetResponse> snippets = Collections.emptyList();
        List<MemoResponse> memos = Collections.emptyList();

        if ("ALL".equals(type) || "CHAT".equals(type)) {
            messages = chatMessageRepository.searchByKeyword(workspaceId, keyword).stream()
                    .map(ChatMessageResponse::from)
                    .collect(Collectors.toList());
        }

        if ("ALL".equals(type) || "SNIPPET".equals(type)) {
            snippets = codeSnippetRepository.searchByKeyword(workspaceId, keyword).stream()
                    .map(SnippetResponse::from)
                    .collect(Collectors.toList());
        }

        if ("ALL".equals(type) || "MEMO".equals(type)) {
            memos = memoRepository.searchByKeyword(workspaceId, keyword).stream()
                    .map(MemoResponse::from)
                    .collect(Collectors.toList());
        }

        int totalCount = messages.size() + snippets.size() + memos.size();
        return new SearchResponse(messages, snippets, memos, totalCount);
    }
}
