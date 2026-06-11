package com.example.auth.repository;

import com.example.auth.entity.GenrePreferenceMediaType;
import com.example.auth.entity.UserGenrePreference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserGenrePreferenceRepository extends JpaRepository<UserGenrePreference, Long> {

    List<UserGenrePreference> findByUserIdOrderByMediaTypeAscPriorityAscIdAsc(Long userId);

    @Modifying(flushAutomatically = true)
    @Query("delete from UserGenrePreference preference where preference.user.id = :userId and preference.mediaType = :mediaType")
    void deleteByUserIdAndMediaType(@Param("userId") Long userId,
                                    @Param("mediaType") GenrePreferenceMediaType mediaType);
}
