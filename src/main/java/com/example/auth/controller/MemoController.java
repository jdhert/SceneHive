package com.example.auth.controller;

import com.example.auth.dto.memo.CreateMemoRequest;
import com.example.auth.dto.memo.MemoResponse;
import com.example.auth.dto.memo.UpdateMemoRequest;
import com.example.auth.service.MemoService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/workspaces/{workspaceId}/memos")
public class MemoController {

    private final MemoService memoService;

    public MemoController(MemoService memoService) {
        this.memoService = memoService;
    }

    @PostMapping
    public ResponseEntity<MemoResponse> createMemo(
            @PathVariable Long workspaceId,
            @Valid @RequestBody CreateMemoRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(memoService.createMemo(workspaceId, request, userDetails.getUsername()));
    }

    @GetMapping
    public ResponseEntity<List<MemoResponse>> getMemos(
            @PathVariable Long workspaceId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(memoService.getMemos(workspaceId, userDetails.getUsername()));
    }

    @GetMapping("/{memoId}")
    public ResponseEntity<MemoResponse> getMemo(
            @PathVariable Long workspaceId,
            @PathVariable Long memoId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(memoService.getMemo(workspaceId, memoId, userDetails.getUsername()));
    }

    @PutMapping("/{memoId}")
    public ResponseEntity<MemoResponse> updateMemo(
            @PathVariable Long workspaceId,
            @PathVariable Long memoId,
            @Valid @RequestBody UpdateMemoRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(memoService.updateMemo(workspaceId, memoId, request, userDetails.getUsername()));
    }

    @DeleteMapping("/{memoId}")
    public ResponseEntity<Void> deleteMemo(
            @PathVariable Long workspaceId,
            @PathVariable Long memoId,
            @AuthenticationPrincipal UserDetails userDetails) {
        memoService.deleteMemo(workspaceId, memoId, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/search")
    public ResponseEntity<List<MemoResponse>> searchMemos(
            @PathVariable Long workspaceId,
            @RequestParam String keyword,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(memoService.searchMemos(workspaceId, keyword, userDetails.getUsername()));
    }
}
