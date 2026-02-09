package com.example.auth.repository;

import com.example.auth.entity.ChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    @Query("SELECT cm FROM ChatMessage cm JOIN FETCH cm.sender WHERE cm.workspace.id = :workspaceId ORDER BY cm.createdAt DESC")
    Page<ChatMessage> findByWorkspaceIdOrderByCreatedAtDesc(@Param("workspaceId") Long workspaceId, Pageable pageable);

    @Query("SELECT cm FROM ChatMessage cm JOIN FETCH cm.sender WHERE cm.workspace.id = :workspaceId ORDER BY cm.createdAt ASC")
    List<ChatMessage> findByWorkspaceIdOrderByCreatedAtAsc(@Param("workspaceId") Long workspaceId);

    @Query("SELECT cm FROM ChatMessage cm JOIN FETCH cm.sender WHERE cm.workspace.id = :workspaceId AND cm.id < :beforeId ORDER BY cm.createdAt DESC")
    Page<ChatMessage> findByWorkspaceIdAndIdLessThan(@Param("workspaceId") Long workspaceId, @Param("beforeId") Long beforeId, Pageable pageable);
}
