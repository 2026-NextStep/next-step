package com.nextstep.backend.job.repository;

import com.nextstep.backend.job.entity.JobBookmark;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

public interface JobBookmarkRepository extends JpaRepository<JobBookmark, Long> {

    Optional<JobBookmark> findByMemberIdAndPostingId(Long memberId, Long postingId);

    boolean existsByMemberIdAndPostingId(Long memberId, Long postingId);

    List<JobBookmark> findByMemberId(Long memberId);

    void deleteByMemberIdAndPostingId(Long memberId, Long postingId);

    List<JobBookmark> findByDeadlineAlertSentFalse();

    @Modifying
    @Transactional
    @Query("UPDATE JobBookmark b SET b.deadlineAlertSent = true WHERE b.bookmarkId IN :ids")
    void markDeadlineAlertSent(@Param("ids") List<Long> ids);

    default Set<Long> findPostingIdSetByMemberId(Long memberId) {
        return findByMemberId(memberId).stream()
                .map(JobBookmark::getPostingId)
                .collect(Collectors.toSet());
    }
}
