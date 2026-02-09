package com.example.auth.service;

import com.example.auth.dto.memo.CreateMemoRequest;
import com.example.auth.dto.memo.MemoResponse;
import com.example.auth.dto.memo.UpdateMemoRequest;
import com.example.auth.entity.Memo;
import com.example.auth.entity.User;
import com.example.auth.entity.Workspace;
import com.example.auth.entity.WorkspaceRole;
import com.example.auth.exception.CustomException;
import com.example.auth.repository.MemoRepository;
import com.example.auth.repository.UserRepository;
import com.example.auth.repository.WorkspaceMemberRepository;
import com.example.auth.repository.WorkspaceRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class MemoService {

    private final MemoRepository memoRepository;
    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository memberRepository;
    private final UserRepository userRepository;

    public MemoService(MemoRepository memoRepository,
                       WorkspaceRepository workspaceRepository,
                       WorkspaceMemberRepository memberRepository,
                       UserRepository userRepository) {
        this.memoRepository = memoRepository;
        this.workspaceRepository = workspaceRepository;
        this.memberRepository = memberRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public MemoResponse createMemo(Long workspaceId, CreateMemoRequest request, String authorEmail) {
        User author = userRepository.findByEmail(authorEmail)
                .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다", HttpStatus.NOT_FOUND));

        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new CustomException("워크스페이스를 찾을 수 없습니다", HttpStatus.NOT_FOUND));

        validateMembership(workspaceId, author.getId());

        Memo memo = Memo.builder()
                .workspace(workspace)
                .author(author)
                .title(request.title())
                .content(request.content())
                .build();

        Memo savedMemo = memoRepository.save(memo);
        return MemoResponse.from(savedMemo);
    }

    @Transactional(readOnly = true)
    public List<MemoResponse> getMemos(Long workspaceId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다", HttpStatus.NOT_FOUND));

        validateMembership(workspaceId, user.getId());

        List<Memo> memos = memoRepository.findByWorkspaceIdOrderByUpdatedAtDesc(workspaceId);
        return memos.stream()
                .map(MemoResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public MemoResponse getMemo(Long workspaceId, Long memoId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다", HttpStatus.NOT_FOUND));

        validateMembership(workspaceId, user.getId());

        Memo memo = memoRepository.findByIdWithAuthor(memoId)
                .orElseThrow(() -> new CustomException("메모를 찾을 수 없습니다", HttpStatus.NOT_FOUND));

        if (!memo.getWorkspace().getId().equals(workspaceId)) {
            throw new CustomException("해당 워크스페이스의 메모가 아닙니다", HttpStatus.BAD_REQUEST);
        }

        return MemoResponse.from(memo);
    }

    @Transactional
    public MemoResponse updateMemo(Long workspaceId, Long memoId, UpdateMemoRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다", HttpStatus.NOT_FOUND));

        Memo memo = memoRepository.findByIdWithAuthor(memoId)
                .orElseThrow(() -> new CustomException("메모를 찾을 수 없습니다", HttpStatus.NOT_FOUND));

        if (!memo.getWorkspace().getId().equals(workspaceId)) {
            throw new CustomException("해당 워크스페이스의 메모가 아닙니다", HttpStatus.BAD_REQUEST);
        }

        // 작성자만 수정 가능
        if (!memo.getAuthor().getId().equals(user.getId())) {
            throw new CustomException("메모 작성자만 수정할 수 있습니다", HttpStatus.FORBIDDEN);
        }

        memo.setTitle(request.title());
        memo.setContent(request.content());

        Memo updatedMemo = memoRepository.save(memo);
        return MemoResponse.from(updatedMemo);
    }

    @Transactional
    public void deleteMemo(Long workspaceId, Long memoId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다", HttpStatus.NOT_FOUND));

        Memo memo = memoRepository.findByIdWithAuthor(memoId)
                .orElseThrow(() -> new CustomException("메모를 찾을 수 없습니다", HttpStatus.NOT_FOUND));

        if (!memo.getWorkspace().getId().equals(workspaceId)) {
            throw new CustomException("해당 워크스페이스의 메모가 아닙니다", HttpStatus.BAD_REQUEST);
        }

        // 작성자 또는 관리자만 삭제 가능
        boolean isAuthor = memo.getAuthor().getId().equals(user.getId());
        boolean isAdmin = isAdminOrOwner(workspaceId, user.getId());

        if (!isAuthor && !isAdmin) {
            throw new CustomException("삭제 권한이 없습니다", HttpStatus.FORBIDDEN);
        }

        memoRepository.delete(memo);
    }

    @Transactional(readOnly = true)
    public List<MemoResponse> searchMemos(Long workspaceId, String keyword, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다", HttpStatus.NOT_FOUND));

        validateMembership(workspaceId, user.getId());

        List<Memo> memos = memoRepository.searchByKeyword(workspaceId, keyword);
        return memos.stream()
                .map(MemoResponse::from)
                .collect(Collectors.toList());
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
