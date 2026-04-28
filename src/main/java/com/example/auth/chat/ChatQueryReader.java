package com.example.auth.chat;

import com.example.auth.dto.chat.ChatMessageResponse;

import java.util.List;

public interface ChatQueryReader {

    List<ChatMessageResponse> searchMessages(Long workspaceId, String keyword);

    List<ChatMessageResponse> findRecentMessages(List<Long> workspaceIds, int limit);
}
