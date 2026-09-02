package com.nextstep.backend.job.repository;

import com.nextstep.backend.job.entity.JobBookmark;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

public interface JobBookmarkRepository extends JpaRepository<JobBookmark, Long> {

    Optional<JobBookmark> findByMemberIdAndPostingId(Long memberId, Long postingId);

    boolean existsByMemberIdAndPostingId(Long memberId, Long postingId);

    List<JobBookmark> findByMemberId(Long memberId);

    void deleteByMemberIdAndPostingId(Long memberId, Long postingId);

    default Set<Long> findPostingIdSetByMemberId(Long memberId) {
        return findByMemberId(memberId).stream()
                .map(JobBookmark::getPostingId)
                .collect(Collectors.toSet());
    }
}
