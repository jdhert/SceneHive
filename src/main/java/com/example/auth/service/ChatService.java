package com.example.auth.service;

import com.example.auth.dto.chat.ChatMessageRequest;
import com.example.auth.dto.chat.ChatMessageResponse;
import com.example.auth.entity.*;
import com.example.auth.event.ChatMessageCreatedEvent;
import com.example.auth.identity.IdentityReader;
import com.example.auth.repository.ChatMessageRepository;
import com.example.auth.workspace.WorkspaceAccessChecker;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final WorkspaceAccessChecker workspaceAccessChecker;
    private final IdentityReader identityReader;
    private final ApplicationEventPublisher eventPublisher;

    public ChatService(ChatMessageRepository chatMessageRepository,
                      WorkspaceAccessChecker workspaceAccessChecker,
                      IdentityReader identityReader,
                      ApplicationEventPublisher eventPublisher) {
        this.chatMessageRepository = chatMessageRepository;
        this.workspaceAccessChecker = workspaceAccessChecker;
        this.identityReader = identityReader;
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    public ChatMessageResponse saveMessage(Long workspaceId, ChatMessageRequest request, String senderEmail) {
        User sender = identityReader.requireUserByEmail(senderEmail);
        Workspace workspace = workspaceAccessChecker.requireWorkspace(workspaceId);
        workspaceAccessChecker.requireMember(workspaceId, sender.getId());

        ChatMessage message = ChatMessage.builder()
                .workspace(workspace)
                .sender(sender)
                .content(request.content())
                .type(request.type())
                .build();

        ChatMessage savedMessage = chatMessageRepository.save(message);

        eventPublisher.publishEvent(new ChatMessageCreatedEvent(
                workspace.getId(), sender.getId(), sender.getName(), sender.getEmail(), request.content()
        ));

        return ChatMessageResponse.from(savedMessage);
    }

    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getMessages(Long workspaceId, String userEmail, int page, int size) {
        User user = identityReader.requireUserByEmail(userEmail);
        workspaceAccessChecker.requireMember(workspaceId, user.getId());

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
