package com.example.auth.repository;

import com.example.auth.entity.CodeSnippet;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CodeSnippetRepository extends JpaRepository<CodeSnippet, Long> {

    @Query("SELECT cs FROM CodeSnippet cs JOIN FETCH cs.author WHERE cs.workspace.id = :workspaceId ORDER BY cs.createdAt DESC")
    List<CodeSnippet> findByWorkspaceIdOrderByCreatedAtDesc(@Param("workspaceId") Long workspaceId);

    @Query("SELECT cs FROM CodeSnippet cs JOIN FETCH cs.author WHERE cs.workspace.id = :workspaceId ORDER BY cs.createdAt DESC")
    Page<CodeSnippet> findByWorkspaceIdOrderByCreatedAtDesc(@Param("workspaceId") Long workspaceId, Pageable pageable);

    @Query("SELECT cs FROM CodeSnippet cs JOIN FETCH cs.author WHERE cs.id = :id")
    Optional<CodeSnippet> findByIdWithAuthor(@Param("id") Long id);

    @Query("SELECT cs FROM CodeSnippet cs JOIN FETCH cs.author WHERE cs.workspace.id = :workspaceId AND cs.language = :language ORDER BY cs.createdAt DESC")
    List<CodeSnippet> findByWorkspaceIdAndLanguage(@Param("workspaceId") Long workspaceId, @Param("language") String language);

    @Query("SELECT cs FROM CodeSnippet cs JOIN FETCH cs.author WHERE cs.workspace.id = :workspaceId AND (LOWER(cs.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(cs.code) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(cs.description) LIKE LOWER(CONCAT('%', :keyword, '%'))) ORDER BY cs.createdAt DESC")
    List<CodeSnippet> searchByKeyword(@Param("workspaceId") Long workspaceId, @Param("keyword") String keyword);
}
