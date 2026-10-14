package com.nextstep.backend.job.service;

import com.nextstep.backend.job.entity.JobBookmark;
import com.nextstep.backend.job.repository.JobBookmarkRepository;
import com.nextstep.backend.job.repository.JobPostingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class JobBookmarkService {

    private final JobBookmarkRepository bookmarkRepository;
    private final JobPostingRepository jobPostingRepository;

    @Transactional
    public Map<String, Object> toggle(Long memberId, Long postingId) {
        if (bookmarkRepository.existsByMemberIdAndPostingId(memberId, postingId)) {
            bookmarkRepository.deleteByMemberIdAndPostingId(memberId, postingId);
            jobPostingRepository.decrementScrapCount(postingId);
            return Map.of("bookmarked", false);
        } else {
            bookmarkRepository.save(new JobBookmark(memberId, postingId));
            jobPostingRepository.incrementScrapCount(postingId);
            return Map.of("bookmarked", true);
        }
    }

    public boolean isBookmarked(Long memberId, Long postingId) {
        return bookmarkRepository.existsByMemberIdAndPostingId(memberId, postingId);
    }

    public List<Map<String, Object>> getBookmarkedPostings(Long memberId) {
        List<JobBookmark> bookmarks = bookmarkRepository.findByMemberId(memberId);
        if (bookmarks.isEmpty()) return Collections.emptyList();

        Map<Long, Boolean> alertSentByPostingId = bookmarks.stream()
                .collect(Collectors.toMap(JobBookmark::getPostingId, JobBookmark::isDeadlineAlertSent, (a, b) -> a));

        LocalDate today = LocalDate.now();

        return jobPostingRepository.findAllById(alertSentByPostingId.keySet())
                .stream()
                .map(job -> {
                    LocalDate endDate = job.getEndDate();
                    boolean isAlwaysRecruiting = endDate == null;
                    long dDay = isAlwaysRecruiting ? 0 : ChronoUnit.DAYS.between(today, endDate);

                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("postingId",          job.getPostingId());
                    m.put("companyName",         job.getCompanyName());
                    m.put("title",               job.getJobTitle());
                    m.put("location",            job.getWorkLocation());
                    m.put("employmentType",      job.getEmploymentType());
                    m.put("careerLevel",         job.getRecruitType());
                    m.put("dDay",                dDay);
                    m.put("isAlwaysRecruiting",  isAlwaysRecruiting);
                    m.put("deadlineAlertSent",   alertSentByPostingId.get(job.getPostingId()));
                    return m;
                })
                .collect(Collectors.toList());
    }
}
