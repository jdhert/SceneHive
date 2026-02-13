package com.example.auth.dto.search;

import com.example.auth.dto.chat.ChatMessageResponse;
import com.example.auth.dto.memo.MemoResponse;
import com.example.auth.dto.snippet.SnippetResponse;

import java.util.List;

public record SearchResponse(
    List<ChatMessageResponse> messages,
    List<SnippetResponse> snippets,
    List<MemoResponse> memos,
    int totalCount
) {}
