package com.example.auth.service;

import com.example.auth.dto.notification.CreateNotificationRequest;
import com.example.auth.dto.notification.NotificationResponse;
import com.example.auth.entity.AuthProvider;
import com.example.auth.entity.Notification;
import com.example.auth.entity.NotificationType;
import com.example.auth.entity.User;
import com.example.auth.identity.IdentityReader;
import com.example.auth.repository.NotificationRepository;
import com.example.auth.workspace.WorkspaceAccessChecker;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private IdentityReader identityReader;

    @Mock
    private WorkspaceAccessChecker workspaceAccessChecker;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @Test
    void createAndSendReturnsExistingNotificationForDuplicateEventId() {
        User recipient = testUser(1L, "viewer@example.com");
        Notification existing = Notification.builder()
                .id(10L)
                .eventId("event-1")
                .recipient(recipient)
                .type(NotificationType.MENTION)
                .title("이미 생성된 알림")
                .message("중복 메시지는 새로 저장하지 않습니다")
                .createdAt(LocalDateTime.now())
                .build();
        NotificationService service = notificationService();

        when(notificationRepository.findByEventId("event-1")).thenReturn(Optional.of(existing));

        NotificationResponse response = service.createAndSend(notificationRequest("event-1"));

        assertEquals(10L, response.id());
        assertEquals("이미 생성된 알림", response.title());
        verify(notificationRepository, never()).save(any(Notification.class));
        verify(identityReader, never()).findUserById(anyLong());
        verify(messagingTemplate, never()).convertAndSendToUser(
                anyString(),
                anyString(),
                any(NotificationResponse.class)
        );
    }

    @Test
    void createAndSendPersistsEventIdForNewNotification() {
        User recipient = testUser(1L, "viewer@example.com");
        NotificationService service = notificationService();

        when(notificationRepository.findByEventId("event-1")).thenReturn(Optional.empty());
        when(identityReader.findUserById(1L)).thenReturn(Optional.of(recipient));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(invocation -> {
            Notification notification = invocation.getArgument(0);
            notification.setId(11L);
            notification.setCreatedAt(LocalDateTime.now());
            return notification;
        });

        service.createAndSend(notificationRequest("event-1"));

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());
        assertEquals("event-1", captor.getValue().getEventId());
    }

    private NotificationService notificationService() {
        return new NotificationService(
                notificationRepository,
                identityReader,
                workspaceAccessChecker,
                messagingTemplate
        );
    }

    private CreateNotificationRequest notificationRequest(String eventId) {
        return new CreateNotificationRequest(
                1L,
                null,
                null,
                NotificationType.MENTION,
                "새 알림",
                "알림 본문",
                "/workspaces/1",
                eventId
        );
    }

    private User testUser(Long id, String email) {
        return User.builder()
                .id(id)
                .email(email)
                .name("viewer")
                .password("password")
                .provider(AuthProvider.LOCAL)
                .createdAt(LocalDateTime.now())
                .build();
    }
}
