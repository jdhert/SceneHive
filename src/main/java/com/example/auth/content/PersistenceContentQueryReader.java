package com.example.auth.content;

import com.example.auth.dto.memo.MemoResponse;
import com.example.auth.dto.snippet.SnippetResponse;
import com.example.auth.repository.CodeSnippetRepository;
import com.example.auth.repository.MemoRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
public class PersistenceContentQueryReader implements ContentQueryReader {

    private final CodeSnippetRepository snippetRepository;
    private final MemoRepository memoRepository;

    public PersistenceContentQueryReader(CodeSnippetRepository snippetRepository,
                                         MemoRepository memoRepository) {
        this.snippetRepository = snippetRepository;
        this.memoRepository = memoRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<SnippetResponse> searchSnippets(Long workspaceId, String keyword) {
        return snippetRepository.searchByKeyword(workspaceId, keyword)
                .stream()
                .map(SnippetResponse::from)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<MemoResponse> searchMemos(Long workspaceId, String keyword) {
        return memoRepository.searchByKeyword(workspaceId, keyword)
                .stream()
                .map(MemoResponse::from)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<SnippetResponse> findRecentSnippets(List<Long> workspaceIds, int limit) {
        return snippetRepository.findRecentByWorkspaceIds(workspaceIds, PageRequest.of(0, limit))
                .map(SnippetResponse::from)
                .getContent();
    }

    @Override
    @Transactional(readOnly = true)
    public List<MemoResponse> findRecentMemos(List<Long> workspaceIds, int limit) {
        return memoRepository.findRecentByWorkspaceIds(workspaceIds, PageRequest.of(0, limit))
                .map(MemoResponse::from)
                .getContent();
    }
}
