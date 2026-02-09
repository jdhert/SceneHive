package com.example.auth.repository;

import com.example.auth.entity.Memo;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MemoRepository extends JpaRepository<Memo, Long> {

    @Query("SELECT m FROM Memo m JOIN FETCH m.author WHERE m.workspace.id = :workspaceId ORDER BY m.updatedAt DESC")
    List<Memo> findByWorkspaceIdOrderByUpdatedAtDesc(@Param("workspaceId") Long workspaceId);

    @Query("SELECT m FROM Memo m JOIN FETCH m.author WHERE m.workspace.id = :workspaceId ORDER BY m.updatedAt DESC")
    Page<Memo> findByWorkspaceIdOrderByUpdatedAtDesc(@Param("workspaceId") Long workspaceId, Pageable pageable);

    @Query("SELECT m FROM Memo m JOIN FETCH m.author WHERE m.id = :id")
    Optional<Memo> findByIdWithAuthor(@Param("id") Long id);

    @Query("SELECT m FROM Memo m JOIN FETCH m.author WHERE m.workspace.id = :workspaceId AND (LOWER(m.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(m.content) LIKE LOWER(CONCAT('%', :keyword, '%'))) ORDER BY m.updatedAt DESC")
    List<Memo> searchByKeyword(@Param("workspaceId") Long workspaceId, @Param("keyword") String keyword);
}
