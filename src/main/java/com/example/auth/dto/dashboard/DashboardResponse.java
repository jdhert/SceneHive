package com.example.auth.dto.dashboard;

import com.example.auth.dto.chat.ChatMessageResponse;
import com.example.auth.dto.memo.MemoResponse;
import com.example.auth.dto.snippet.SnippetResponse;
import com.example.auth.dto.workspace.WorkspaceResponse;

import java.util.List;

public record DashboardResponse(
    List<WorkspaceResponse> workspaces,
    List<ChatMessageResponse> recentMessages,
    List<SnippetResponse> recentSnippets,
    List<MemoResponse> recentMemos
) {}
