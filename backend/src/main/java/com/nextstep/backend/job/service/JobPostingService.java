package com.nextstep.backend.job.service;

import com.nextstep.backend.job.dto.JobPostingDetailDto;
import com.nextstep.backend.job.dto.JobPostingDto;
import com.nextstep.backend.job.entity.JobPosting;
import com.nextstep.backend.job.entity.JobPostingDetail;
import com.nextstep.backend.job.repository.JobBookmarkRepository;
import com.nextstep.backend.job.repository.JobPostingDetailRepository;
import com.nextstep.backend.job.repository.JobPostingRepository;
import com.nextstep.backend.job.spec.JobPostingSpec;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.stream.Collectors;

@Service
public class JobPostingService {

    private final JobPostingRepository repository;
    private final JobPostingDetailRepository detailRepository;
    private final JobBookmarkRepository bookmarkRepository;

    public JobPostingService(JobPostingRepository repository,
                             JobPostingDetailRepository detailRepository,
                             JobBookmarkRepository bookmarkRepository) {
        this.repository         = repository;
        this.detailRepository   = detailRepository;
        this.bookmarkRepository = bookmarkRepository;
    }

    public Page<JobPostingDto> getJobs(int page, int size, String search, String employment,
                                       String region, String status, String quickFilter, String sort,
                                       Long memberId) {
        Sort sortOrder = switch (sort) {
            case "마감일순" -> Sort.by(Sort.Direction.ASC, "endDate");
            case "조회수순" -> Sort.by(Sort.Direction.DESC, "viewCount");
            default        -> Sort.by(Sort.Direction.DESC, "startDate");
        };

        PageRequest pageable = PageRequest.of(page, size, sortOrder);

        Specification<JobPosting> spec = Specification
            .where(JobPostingSpec.searchKeyword(search))
            .and(JobPostingSpec.employmentType(employment))
            .and(JobPostingSpec.workLocation(region))
            .and(JobPostingSpec.statusFilter(status))
            .and(JobPostingSpec.quickFilter(quickFilter))
            .and(JobPostingSpec.excludeExpiredUnless(status));

        Set<Long> bookmarkedIds = (memberId != null)
                ? bookmarkRepository.findPostingIdSetByMemberId(memberId)
                : Collections.emptySet();

        return repository.findAll(spec, pageable)
                .map(job -> JobPostingDto.from(job, bookmarkedIds.contains(job.getPostingId())));
    }

    public JobPostingDetailDto getJobDetail(Long id) {
        JobPosting job = repository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "공고를 찾을 수 없습니다."));
        JobPostingDetail detail = detailRepository.findById(id).orElse(null);
        return JobPostingDetailDto.from(job, detail);
    }

    public Map<String, List<String>> getFilters() {
        List<String> empTypes = repository.findDistinctEmploymentTypes().stream()
            .filter(v -> v != null)
            .flatMap(v -> Arrays.stream(v.split(",")))
            .map(String::trim)
            .filter(v -> !v.isEmpty())
            .collect(Collectors.toCollection(TreeSet::new))
            .stream().sorted().collect(Collectors.toList());

        List<String> regions = repository.findDistinctWorkLocations().stream()
            .filter(v -> v != null)
            .flatMap(v -> Arrays.stream(v.split(",")))
            .map(String::trim)
            .filter(v -> !v.isEmpty())
            .collect(Collectors.toCollection(TreeSet::new))
            .stream().sorted().collect(Collectors.toList());

        return Map.of("employmentTypes", empTypes, "regions", regions);
    }

    public void incrementViewCount(Long id) {
        repository.incrementViewCount(id);
    }

    public void updateStatus(Long id, String status) {
        if (!repository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "공고를 찾을 수 없습니다.");
        }
        repository.updateStatus(id, status);
    }

    public long countJobs() {
        return repository.count();
    }
}
