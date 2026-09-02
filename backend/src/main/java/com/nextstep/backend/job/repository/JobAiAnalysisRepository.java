package com.nextstep.backend.job.repository;

import com.nextstep.backend.job.entity.JobAiAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface JobAiAnalysisRepository extends JpaRepository<JobAiAnalysis, Long> {
    Optional<JobAiAnalysis> findByPostingId(Long postingId);

    List<JobAiAnalysis> findByMemberIdOrderByCreatedAtDesc(Long memberId);

    boolean existsByPostingIdAndMemberId(Long postingId, Long memberId);

    @Modifying
    @Query("UPDATE JobAiAnalysis a SET a.memberId = :memberId WHERE a.postingId = :postingId")
    void updateMemberIdByPostingId(@Param("postingId") Long postingId, @Param("memberId") Long memberId);
}
