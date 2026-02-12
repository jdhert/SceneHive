package com.example.auth.service;

import com.example.auth.dto.chat.ChatMessageRequest;
import com.example.auth.dto.chat.ChatMessageResponse;
import com.example.auth.dto.notification.CreateNotificationRequest;
import com.example.auth.entity.*;
import com.example.auth.exception.CustomException;
import com.example.auth.repository.ChatMessageRepository;
import com.example.auth.repository.UserRepository;
import com.example.auth.repository.WorkspaceMemberRepository;
import com.example.auth.repository.WorkspaceRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class ChatService {

    private static final Logger log = LoggerFactory.getLogger(ChatService.class);
    private static final Pattern MENTION_PATTERN = Pattern.compile("@(\\S+)");

    private final ChatMessageRepository chatMessageRepository;
    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository memberRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final ChatPresenceTracker chatPresenceTracker;

    public ChatService(ChatMessageRepository chatMessageRepository,
                      WorkspaceRepository workspaceRepository,
                      WorkspaceMemberRepository memberRepository,
                      UserRepository userRepository,
                      NotificationService notificationService,
                      ChatPresenceTracker chatPresenceTracker) {
        this.chatMessageRepository = chatMessageRepository;
        this.workspaceRepository = workspaceRepository;
        this.memberRepository = memberRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.chatPresenceTracker = chatPresenceTracker;
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

        // 워크스페이스 멤버에게 알림 전송 (발신자 제외)
        notifyWorkspaceMembers(workspace, sender, request.content());

        return ChatMessageResponse.from(savedMessage);
    }

    private void notifyWorkspaceMembers(Workspace workspace, User sender, String content) {
        try {
            List<WorkspaceMember> members = memberRepository.findAllByWorkspaceId(workspace.getId());
            String preview = content.length() > 100 ? content.substring(0, 100) + "..." : content;
            Set<String> mentionedNames = parseMentions(content);
            String relatedUrl = "/workspaces/" + workspace.getId();

            for (WorkspaceMember member : members) {
                User user = member.getUser();
                if (user.getId().equals(sender.getId())) continue;

                if (mentionedNames.contains(user.getName())) {
                    // 멘션 알림 — 채팅방에 있어도 전송
                    notificationService.createAndSend(new CreateNotificationRequest(
                            user.getId(), sender.getId(), workspace.getId(),
                            NotificationType.MENTION,
                            sender.getName() + "님이 회원님을 멘션했습니다",
                            preview, relatedUrl
                    ));
                } else if (!chatPresenceTracker.isUserActive(workspace.getId(), user.getEmail())) {
                    // 일반 채팅 알림 — 채팅방에 없을 때만
                    notificationService.createAndSend(new CreateNotificationRequest(
                            user.getId(), sender.getId(), workspace.getId(),
                            NotificationType.NEW_CHAT_MESSAGE,
                            sender.getName() + "님이 메시지를 보냈습니다",
                            preview, relatedUrl
                    ));
                }
            }
        } catch (Exception e) {
            log.warn("Failed to send chat notifications for workspace {}", workspace.getId(), e);
        }
    }

    private Set<String> parseMentions(String content) {
        Set<String> mentions = new HashSet<>();
        Matcher matcher = MENTION_PATTERN.matcher(content);
        while (matcher.find()) {
            mentions.add(matcher.group(1));
        }
        return mentions;
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
