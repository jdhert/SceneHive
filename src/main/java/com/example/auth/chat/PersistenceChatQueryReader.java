package com.example.auth.chat;

import com.example.auth.dto.chat.ChatMessageResponse;
import com.example.auth.repository.ChatMessageRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
public class PersistenceChatQueryReader implements ChatQueryReader {

    private final ChatMessageRepository chatMessageRepository;

    public PersistenceChatQueryReader(ChatMessageRepository chatMessageRepository) {
        this.chatMessageRepository = chatMessageRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChatMessageResponse> searchMessages(Long workspaceId, String keyword) {
        return chatMessageRepository.searchByKeyword(workspaceId, keyword)
                .stream()
                .map(ChatMessageResponse::from)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChatMessageResponse> findRecentMessages(List<Long> workspaceIds, int limit) {
        return chatMessageRepository.findRecentByWorkspaceIds(workspaceIds, PageRequest.of(0, limit))
                .map(ChatMessageResponse::from)
                .getContent();
    }
}
