package com.example.auth.service;

import com.example.auth.dto.notification.CreateNotificationRequest;
import com.example.auth.dto.notification.NotificationResponse;
import com.example.auth.entity.Notification;
import com.example.auth.entity.User;
import com.example.auth.entity.Workspace;
import com.example.auth.exception.CustomException;
import com.example.auth.identity.IdentityReader;
import com.example.auth.repository.NotificationRepository;
import com.example.auth.workspace.WorkspaceAccessChecker;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final NotificationRepository notificationRepository;
    private final IdentityReader identityReader;
    private final WorkspaceAccessChecker workspaceAccessChecker;
    private final SimpMessagingTemplate messagingTemplate;

    public NotificationService(NotificationRepository notificationRepository,
                               IdentityReader identityReader,
                               WorkspaceAccessChecker workspaceAccessChecker,
                               SimpMessagingTemplate messagingTemplate) {
        this.notificationRepository = notificationRepository;
        this.identityReader = identityReader;
        this.workspaceAccessChecker = workspaceAccessChecker;
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional
    public NotificationResponse createAndSend(CreateNotificationRequest request) {
        User recipient = identityReader.findUserById(request.recipientId())
                .orElseThrow(() -> new CustomException("알림 수신자를 찾을 수 없습니다", HttpStatus.NOT_FOUND));

        User sender = null;
        if (request.senderId() != null) {
            sender = identityReader.findUserById(request.senderId()).orElse(null);
        }

        Workspace workspace = null;
        if (request.workspaceId() != null) {
            workspace = workspaceAccessChecker.findWorkspace(request.workspaceId()).orElse(null);
        }

        Notification notification = Notification.builder()
                .recipient(recipient)
                .sender(sender)
                .workspace(workspace)
                .type(request.type())
                .title(request.title())
                .message(request.message())
                .relatedUrl(request.relatedUrl())
                .build();

        Notification saved = notificationRepository.save(notification);
        NotificationResponse response = NotificationResponse.from(saved);

        try {
            messagingTemplate.convertAndSendToUser(
                    recipient.getEmail(),
                    "/queue/notifications",
                    response
            );
        } catch (Exception e) {
            log.warn("Failed to send WebSocket notification to {}: {}",
                    recipient.getEmail(), e.getMessage());
        }

        return response;
    }

    @Transactional(readOnly = true)
    public Page<NotificationResponse> getNotifications(String userEmail, int page, int size) {
        User user = findUserByEmail(userEmail);
        Pageable pageable = PageRequest.of(page, size);
        return notificationRepository.findByRecipientId(user.getId(), pageable)
                .map(NotificationResponse::from);
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(String userEmail) {
        User user = findUserByEmail(userEmail);
        return notificationRepository.countUnreadByRecipientId(user.getId());
    }

    @Transactional
    public NotificationResponse markAsRead(Long notificationId, String userEmail) {
        User user = findUserByEmail(userEmail);
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new CustomException("알림을 찾을 수 없습니다", HttpStatus.NOT_FOUND));

        if (!notification.getRecipient().getId().equals(user.getId())) {
            throw new CustomException("알림에 대한 접근 권한이 없습니다", HttpStatus.FORBIDDEN);
        }

        if (!notification.isRead()) {
            notification.setRead(true);
            notification.setReadAt(LocalDateTime.now());
            notificationRepository.save(notification);
        }

        return NotificationResponse.from(notification);
    }

    @Transactional
    public void markAllAsRead(String userEmail) {
        User user = findUserByEmail(userEmail);
        notificationRepository.markAllAsReadByRecipientId(user.getId());
    }

    @Transactional
    public void deleteNotification(Long notificationId, String userEmail) {
        User user = findUserByEmail(userEmail);
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new CustomException("알림을 찾을 수 없습니다", HttpStatus.NOT_FOUND));

        if (!notification.getRecipient().getId().equals(user.getId())) {
            throw new CustomException("알림에 대한 접근 권한이 없습니다", HttpStatus.FORBIDDEN);
        }

        notificationRepository.delete(notification);
    }

    private User findUserByEmail(String email) {
        return identityReader.requireUserByEmail(email);
    }
}
