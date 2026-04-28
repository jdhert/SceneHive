package com.example.auth.content;

import com.example.auth.dto.memo.MemoResponse;
import com.example.auth.dto.snippet.SnippetResponse;

import java.util.List;

public interface ContentQueryReader {

    List<SnippetResponse> searchSnippets(Long workspaceId, String keyword);

    List<MemoResponse> searchMemos(Long workspaceId, String keyword);

    List<SnippetResponse> findRecentSnippets(List<Long> workspaceIds, int limit);

    List<MemoResponse> findRecentMemos(List<Long> workspaceIds, int limit);
}
