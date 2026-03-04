package com.example.auth.service;

import com.example.auth.dto.search.SearchResponse;
import com.example.auth.entity.User;
import com.example.auth.exception.CustomException;
import com.example.auth.repository.ChatMessageRepository;
import com.example.auth.repository.CodeSnippetRepository;
import com.example.auth.repository.MemoRepository;
import com.example.auth.repository.UserRepository;
import com.example.auth.repository.WorkspaceMemberRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SearchServiceTest {

    @Mock
    private ChatMessageRepository chatMessageRepository;

    @Mock
    private CodeSnippetRepository codeSnippetRepository;

    @Mock
    private MemoRepository memoRepository;

    @Mock
    private WorkspaceMemberRepository memberRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private SearchService searchService;

    @Test
    void searchThrowsWhenUserMissing() {
        when(userRepository.findByEmail("missing@test.com")).thenReturn(Optional.empty());

        CustomException exception = assertThrows(
                CustomException.class,
                () -> searchService.search(1L, "hello", "ALL", "missing@test.com")
        );

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatus());
    }

    @Test
    void searchThrowsWhenUserIsNotMember() {
        User user = testUser(1L, "user@test.com");
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(memberRepository.existsByWorkspaceIdAndUserId(100L, 1L)).thenReturn(false);

        CustomException exception = assertThrows(
                CustomException.class,
                () -> searchService.search(100L, "hello", "ALL", "user@test.com")
        );

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatus());
    }

    @Test
    void searchAllQueriesAllRepositories() {
        User user = testUser(1L, "user@test.com");
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(memberRepository.existsByWorkspaceIdAndUserId(100L, 1L)).thenReturn(true);
        when(chatMessageRepository.searchByKeyword(100L, "hello")).thenReturn(Collections.emptyList());
        when(codeSnippetRepository.searchByKeyword(100L, "hello")).thenReturn(Collections.emptyList());
        when(memoRepository.searchByKeyword(100L, "hello")).thenReturn(Collections.emptyList());

        SearchResponse response = searchService.search(100L, "hello", "ALL", "user@test.com");

        assertEquals(0, response.totalCount());
        verify(chatMessageRepository).searchByKeyword(100L, "hello");
        verify(codeSnippetRepository).searchByKeyword(100L, "hello");
        verify(memoRepository).searchByKeyword(100L, "hello");
    }

    @Test
    void searchChatTypeQueriesOnlyChatRepository() {
        User user = testUser(1L, "user@test.com");
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(memberRepository.existsByWorkspaceIdAndUserId(100L, 1L)).thenReturn(true);
        when(chatMessageRepository.searchByKeyword(100L, "hello")).thenReturn(Collections.emptyList());

        SearchResponse response = searchService.search(100L, "hello", "CHAT", "user@test.com");

        assertEquals(0, response.totalCount());
        verify(chatMessageRepository).searchByKeyword(100L, "hello");
        verify(codeSnippetRepository, never()).searchByKeyword(100L, "hello");
        verify(memoRepository, never()).searchByKeyword(100L, "hello");
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
