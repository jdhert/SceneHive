package com.example.auth.service;

import com.example.auth.dto.chat.ChatMessageRequest;
import com.example.auth.dto.chat.ChatMessageResponse;
import com.example.auth.entity.ChatMessage;
import com.example.auth.entity.User;
import com.example.auth.entity.Workspace;
import com.example.auth.exception.CustomException;
import com.example.auth.repository.ChatMessageRepository;
import com.example.auth.repository.UserRepository;
import com.example.auth.repository.WorkspaceMemberRepository;
import com.example.auth.repository.WorkspaceRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository memberRepository;
    private final UserRepository userRepository;

    public ChatService(ChatMessageRepository chatMessageRepository,
                      WorkspaceRepository workspaceRepository,
                      WorkspaceMemberRepository memberRepository,
                      UserRepository userRepository) {
        this.chatMessageRepository = chatMessageRepository;
        this.workspaceRepository = workspaceRepository;
        this.memberRepository = memberRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public ChatMessageResponse saveMessage(Long workspaceId, ChatMessageRequest request, String senderEmail) {
        User sender = userRepository.findByEmail(senderEmail)
                .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다", HttpStatus.NOT_FOUND));

        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new CustomException("워크스페이스를 찾을 수 없습니다", HttpStatus.NOT_FOUND));

        // 멤버십 확인
        if (!memberRepository.existsByWorkspaceIdAndUserId(workspaceId, sender.getId())) {
            throw new CustomException("워크스페이스에 접근 권한이 없습니다", HttpStatus.FORBIDDEN);
        }

        ChatMessage message = ChatMessage.builder()
                .workspace(workspace)
                .sender(sender)
                .content(request.content())
                .type(request.type())
                .build();

        ChatMessage savedMessage = chatMessageRepository.save(message);
        return ChatMessageResponse.from(savedMessage);
    }

    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getMessages(Long workspaceId, String userEmail, int page, int size) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다", HttpStatus.NOT_FOUND));

        // 멤버십 확인
        if (!memberRepository.existsByWorkspaceIdAndUserId(workspaceId, user.getId())) {
            throw new CustomException("워크스페이스에 접근 권한이 없습니다", HttpStatus.FORBIDDEN);
        }

        Pageable pageable = PageRequest.of(page, size);
        Page<ChatMessage> messagePage = chatMessageRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspaceId, pageable);

        List<ChatMessageResponse> messages = messagePage.getContent().stream()
                .map(ChatMessageResponse::from)
                .collect(Collectors.toList());

        // 최신 메시지가 아래에 오도록 역순 정렬
        Collections.reverse(messages);
        return messages;
    }

    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getRecentMessages(Long workspaceId, String userEmail) {
        return getMessages(workspaceId, userEmail, 0, 50);
    }
}
