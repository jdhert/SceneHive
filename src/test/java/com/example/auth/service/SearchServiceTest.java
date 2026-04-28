package com.example.auth.service;

import com.example.auth.dto.search.SearchResponse;
import com.example.auth.entity.User;
import com.example.auth.exception.CustomException;
import com.example.auth.chat.ChatQueryReader;
import com.example.auth.content.ContentQueryReader;
import com.example.auth.identity.IdentityReader;
import com.example.auth.workspace.WorkspaceAccessChecker;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SearchServiceTest {

    @Mock
    private ChatQueryReader chatQueryReader;

    @Mock
    private ContentQueryReader contentQueryReader;

    @Mock
    private WorkspaceAccessChecker workspaceAccessChecker;

    @Mock
    private IdentityReader identityReader;

    @InjectMocks
    private SearchService searchService;

    @Test
    void searchThrowsWhenUserMissing() {
        when(identityReader.requireUserByEmail("missing@test.com"))
                .thenThrow(new CustomException("사용자를 찾을 수 없습니다", HttpStatus.NOT_FOUND));

        CustomException exception = assertThrows(
                CustomException.class,
                () -> searchService.search(1L, "hello", "ALL", "missing@test.com")
        );

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatus());
    }

    @Test
    void searchThrowsWhenUserIsNotMember() {
        User user = testUser(1L, "user@test.com");
        when(identityReader.requireUserByEmail("user@test.com")).thenReturn(user);
        doThrow(new CustomException("워크스페이스에 접근 권한이 없습니다", HttpStatus.FORBIDDEN))
                .when(workspaceAccessChecker).requireMember(100L, 1L);

        CustomException exception = assertThrows(
                CustomException.class,
                () -> searchService.search(100L, "hello", "ALL", "user@test.com")
        );

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatus());
    }

    @Test
    void searchAllQueriesAllRepositories() {
        User user = testUser(1L, "user@test.com");
        when(identityReader.requireUserByEmail("user@test.com")).thenReturn(user);
        when(chatQueryReader.searchMessages(100L, "hello")).thenReturn(Collections.emptyList());
        when(contentQueryReader.searchSnippets(100L, "hello")).thenReturn(Collections.emptyList());
        when(contentQueryReader.searchMemos(100L, "hello")).thenReturn(Collections.emptyList());

        SearchResponse response = searchService.search(100L, "hello", "ALL", "user@test.com");

        assertEquals(0, response.totalCount());
        verify(chatQueryReader).searchMessages(100L, "hello");
        verify(contentQueryReader).searchSnippets(100L, "hello");
        verify(contentQueryReader).searchMemos(100L, "hello");
    }

    @Test
    void searchChatTypeQueriesOnlyChatRepository() {
        User user = testUser(1L, "user@test.com");
        when(identityReader.requireUserByEmail("user@test.com")).thenReturn(user);
        when(chatQueryReader.searchMessages(100L, "hello")).thenReturn(Collections.emptyList());

        SearchResponse response = searchService.search(100L, "hello", "CHAT", "user@test.com");

        assertEquals(0, response.totalCount());
        verify(chatQueryReader).searchMessages(100L, "hello");
        verify(contentQueryReader, never()).searchSnippets(100L, "hello");
        verify(contentQueryReader, never()).searchMemos(100L, "hello");
    }

    private User testUser(Long id, String email) {
        return User.builder()
                .id(id)
                .email(email)
                .name("Test User")
                .password("encoded")
                .build();
    }
}
