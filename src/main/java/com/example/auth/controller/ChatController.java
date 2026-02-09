package com.example.auth.controller;

import com.example.auth.dto.chat.ChatMessageRequest;
import com.example.auth.dto.chat.ChatMessageResponse;
import com.example.auth.service.ChatService;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/workspaces/{workspaceId}/messages")
public class ChatController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    public ChatController(ChatService chatService, SimpMessagingTemplate messagingTemplate) {
        this.chatService = chatService;
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * REST API: 메시지 히스토리 조회
     */
    @GetMapping
    public List<ChatMessageResponse> getMessages(
            @PathVariable Long workspaceId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @AuthenticationPrincipal UserDetails userDetails) {
        return chatService.getMessages(workspaceId, userDetails.getUsername(), page, size);
    }

    /**
     * REST API: 메시지 전송 (WebSocket 대안)
     */
    @PostMapping
    public ChatMessageResponse sendMessage(
            @PathVariable Long workspaceId,
            @RequestBody ChatMessageRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        ChatMessageResponse response = chatService.saveMessage(workspaceId, request, userDetails.getUsername());

        // WebSocket으로 브로드캐스트
        messagingTemplate.convertAndSend("/topic/workspace/" + workspaceId, response);

        return response;
    }

    /**
     * WebSocket: 실시간 메시지 전송
     * 클라이언트가 /app/chat/{workspaceId}로 메시지를 보내면
     * /topic/workspace/{workspaceId}로 브로드캐스트
     */
    @MessageMapping("/chat/{workspaceId}")
    public void handleWebSocketMessage(
            @DestinationVariable Long workspaceId,
            @Payload ChatMessageRequest request,
            Principal principal) {

        ChatMessageResponse response = chatService.saveMessage(workspaceId, request, principal.getName());

        // 해당 워크스페이스의 모든 구독자에게 브로드캐스트
        messagingTemplate.convertAndSend("/topic/workspace/" + workspaceId, response);
    }
}
