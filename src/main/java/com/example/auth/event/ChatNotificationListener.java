package com.example.auth.event;

import com.example.auth.entity.WorkspaceMember;
import com.example.auth.entity.User;
import com.example.auth.notification.NotificationCommandPublisher;
import com.example.auth.notification.contract.NotificationCommand;
import com.example.auth.notification.contract.NotificationCommandType;
import com.example.auth.service.ChatPresenceTracker;
import com.example.auth.workspace.WorkspaceAccessChecker;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class ChatNotificationListener {

    private static final Logger log = LoggerFactory.getLogger(ChatNotificationListener.class);
    private static final Pattern MENTION_PATTERN = Pattern.compile("@(\\S+)");

    private final WorkspaceAccessChecker workspaceAccessChecker;
    private final NotificationCommandPublisher notificationCommandPublisher;
    private final ChatPresenceTracker chatPresenceTracker;

    public ChatNotificationListener(WorkspaceAccessChecker workspaceAccessChecker,
                                    NotificationCommandPublisher notificationCommandPublisher,
                                    ChatPresenceTracker chatPresenceTracker) {
        this.workspaceAccessChecker = workspaceAccessChecker;
        this.notificationCommandPublisher = notificationCommandPublisher;
        this.chatPresenceTracker = chatPresenceTracker;
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onChatMessageCreated(ChatMessageCreatedEvent event) {
        try {
            List<WorkspaceMember> members = workspaceAccessChecker.findMembers(event.workspaceId());
            String preview = event.content().length() > 100
                    ? event.content().substring(0, 100) + "..."
                    : event.content();
            Set<String> mentionedNames = parseMentions(event.content());
            String relatedUrl = "/workspaces/" + event.workspaceId();

            for (WorkspaceMember member : members) {
                User user = member.getUser();
                if (user.getId().equals(event.senderId())) continue;

                if (mentionedNames.contains(user.getName())) {
                    publishNotificationCommand(NotificationCommand.create(
                            user.getId(), event.senderId(), event.workspaceId(),
                            NotificationCommandType.MENTION,
                            event.senderName() + "님이 회원님을 멘션했습니다",
                            preview, relatedUrl
                    ));
                } else if (!chatPresenceTracker.isUserActive(event.workspaceId(), user.getEmail())) {
                    publishNotificationCommand(NotificationCommand.create(
                            user.getId(), event.senderId(), event.workspaceId(),
                            NotificationCommandType.NEW_CHAT_MESSAGE,
                            event.senderName() + "님이 메시지를 보냈습니다",
                            preview, relatedUrl
                    ));
                }
            }
        } catch (Exception e) {
            log.warn("Failed to send chat notifications for workspace {}", event.workspaceId(), e);
        }
    }

    private void publishNotificationCommand(NotificationCommand command) {
        notificationCommandPublisher.publish(command);
    }

    private Set<String> parseMentions(String content) {
        Set<String> mentions = new HashSet<>();
        Matcher matcher = MENTION_PATTERN.matcher(content);
        while (matcher.find()) {
            mentions.add(matcher.group(1));
        }
        return mentions;
    }
}
