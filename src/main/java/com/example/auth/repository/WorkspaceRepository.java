package com.example.auth.repository;

import com.example.auth.entity.Workspace;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkspaceRepository extends JpaRepository<Workspace, Long> {

    Optional<Workspace> findByInviteCode(String inviteCode);

    @Query("SELECT w FROM Workspace w JOIN w.members m WHERE m.user.id = :userId")
    List<Workspace> findAllByMemberId(@Param("userId") Long userId);

    @Query("SELECT w FROM Workspace w WHERE w.owner.id = :ownerId")
    List<Workspace> findAllByOwnerId(@Param("ownerId") Long ownerId);

    boolean existsByInviteCode(String inviteCode);
}
