package com.example.auth.service;

import com.example.auth.dto.snippet.CreateSnippetRequest;
import com.example.auth.dto.snippet.SnippetResponse;
import com.example.auth.dto.snippet.UpdateSnippetRequest;
import com.example.auth.entity.CodeSnippet;
import com.example.auth.entity.User;
import com.example.auth.entity.Workspace;
import com.example.auth.entity.WorkspaceRole;
import com.example.auth.exception.CustomException;
import com.example.auth.repository.CodeSnippetRepository;
import com.example.auth.repository.UserRepository;
import com.example.auth.repository.WorkspaceMemberRepository;
import com.example.auth.repository.WorkspaceRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SnippetService {

    private final CodeSnippetRepository snippetRepository;
    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository memberRepository;
    private final UserRepository userRepository;

    public SnippetService(CodeSnippetRepository snippetRepository,
                         WorkspaceRepository workspaceRepository,
                         WorkspaceMemberRepository memberRepository,
                         UserRepository userRepository) {
        this.snippetRepository = snippetRepository;
        this.workspaceRepository = workspaceRepository;
        this.memberRepository = memberRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public SnippetResponse createSnippet(Long workspaceId, CreateSnippetRequest request, String authorEmail) {
        User author = userRepository.findByEmail(authorEmail)
                .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다", HttpStatus.NOT_FOUND));

        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new CustomException("워크스페이스를 찾을 수 없습니다", HttpStatus.NOT_FOUND));

        validateMembership(workspaceId, author.getId());

        CodeSnippet snippet = CodeSnippet.builder()
                .workspace(workspace)
                .author(author)
                .title(request.title())
                .code(request.code())
                .language(request.language())
                .description(request.description())
                .build();

        CodeSnippet savedSnippet = snippetRepository.save(snippet);
        return SnippetResponse.from(savedSnippet);
    }

    @Transactional(readOnly = true)
    public List<SnippetResponse> getSnippets(Long workspaceId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다", HttpStatus.NOT_FOUND));

        validateMembership(workspaceId, user.getId());

        List<CodeSnippet> snippets = snippetRepository.findByWorkspaceIdOrderByCreatedAtDesc(workspaceId);
        return snippets.stream()
                .map(SnippetResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SnippetResponse getSnippet(Long workspaceId, Long snippetId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다", HttpStatus.NOT_FOUND));

        validateMembership(workspaceId, user.getId());

        CodeSnippet snippet = snippetRepository.findByIdWithAuthor(snippetId)
                .orElseThrow(() -> new CustomException("스니펫을 찾을 수 없습니다", HttpStatus.NOT_FOUND));

        if (!snippet.getWorkspace().getId().equals(workspaceId)) {
            throw new CustomException("해당 워크스페이스의 스니펫이 아닙니다", HttpStatus.BAD_REQUEST);
        }

        return SnippetResponse.from(snippet);
    }

    @Transactional
    public SnippetResponse updateSnippet(Long workspaceId, Long snippetId, UpdateSnippetRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다", HttpStatus.NOT_FOUND));

        CodeSnippet snippet = snippetRepository.findByIdWithAuthor(snippetId)
                .orElseThrow(() -> new CustomException("스니펫을 찾을 수 없습니다", HttpStatus.NOT_FOUND));

        if (!snippet.getWorkspace().getId().equals(workspaceId)) {
            throw new CustomException("해당 워크스페이스의 스니펫이 아닙니다", HttpStatus.BAD_REQUEST);
        }

        // 작성자만 수정 가능
        if (!snippet.getAuthor().getId().equals(user.getId())) {
            throw new CustomException("스니펫 작성자만 수정할 수 있습니다", HttpStatus.FORBIDDEN);
        }

        snippet.setTitle(request.title());
        snippet.setCode(request.code());
        snippet.setLanguage(request.language());
        snippet.setDescription(request.description());

        CodeSnippet updatedSnippet = snippetRepository.save(snippet);
        return SnippetResponse.from(updatedSnippet);
    }

    @Transactional
    public void deleteSnippet(Long workspaceId, Long snippetId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다", HttpStatus.NOT_FOUND));

        CodeSnippet snippet = snippetRepository.findByIdWithAuthor(snippetId)
                .orElseThrow(() -> new CustomException("스니펫을 찾을 수 없습니다", HttpStatus.NOT_FOUND));

        if (!snippet.getWorkspace().getId().equals(workspaceId)) {
            throw new CustomException("해당 워크스페이스의 스니펫이 아닙니다", HttpStatus.BAD_REQUEST);
        }

        // 작성자 또는 관리자만 삭제 가능
        boolean isAuthor = snippet.getAuthor().getId().equals(user.getId());
        boolean isAdmin = isAdminOrOwner(workspaceId, user.getId());

        if (!isAuthor && !isAdmin) {
            throw new CustomException("삭제 권한이 없습니다", HttpStatus.FORBIDDEN);
        }

        snippetRepository.delete(snippet);
    }

    private void validateMembership(Long workspaceId, Long userId) {
        if (!memberRepository.existsByWorkspaceIdAndUserId(workspaceId, userId)) {
            throw new CustomException("워크스페이스에 접근 권한이 없습니다", HttpStatus.FORBIDDEN);
        }
    }

    private boolean isAdminOrOwner(Long workspaceId, Long userId) {
        WorkspaceRole role = memberRepository.findRoleByWorkspaceIdAndUserId(workspaceId, userId)
                .orElse(null);
        return role == WorkspaceRole.OWNER || role == WorkspaceRole.ADMIN;
    }
}
