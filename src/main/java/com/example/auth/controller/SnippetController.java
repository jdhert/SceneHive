package com.example.auth.controller;

import com.example.auth.dto.snippet.CreateSnippetRequest;
import com.example.auth.dto.snippet.SnippetResponse;
import com.example.auth.dto.snippet.UpdateSnippetRequest;
import com.example.auth.service.SnippetService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/workspaces/{workspaceId}/snippets")
public class SnippetController {

    private final SnippetService snippetService;

    public SnippetController(SnippetService snippetService) {
        this.snippetService = snippetService;
    }

    @PostMapping
    public ResponseEntity<SnippetResponse> createSnippet(
            @PathVariable Long workspaceId,
            @Valid @RequestBody CreateSnippetRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(snippetService.createSnippet(workspaceId, request, userDetails.getUsername()));
    }

    @GetMapping
    public ResponseEntity<List<SnippetResponse>> getSnippets(
            @PathVariable Long workspaceId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(snippetService.getSnippets(workspaceId, userDetails.getUsername()));
    }

    @GetMapping("/{snippetId}")
    public ResponseEntity<SnippetResponse> getSnippet(
            @PathVariable Long workspaceId,
            @PathVariable Long snippetId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(snippetService.getSnippet(workspaceId, snippetId, userDetails.getUsername()));
    }

    @PutMapping("/{snippetId}")
    public ResponseEntity<SnippetResponse> updateSnippet(
            @PathVariable Long workspaceId,
            @PathVariable Long snippetId,
            @Valid @RequestBody UpdateSnippetRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(snippetService.updateSnippet(workspaceId, snippetId, request, userDetails.getUsername()));
    }

    @DeleteMapping("/{snippetId}")
    public ResponseEntity<Void> deleteSnippet(
            @PathVariable Long workspaceId,
            @PathVariable Long snippetId,
            @AuthenticationPrincipal UserDetails userDetails) {
        snippetService.deleteSnippet(workspaceId, snippetId, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }
}
