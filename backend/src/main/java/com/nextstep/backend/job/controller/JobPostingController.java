package com.nextstep.backend.job.controller;

import com.nextstep.backend.common.util.SecurityUtil;
import com.nextstep.backend.job.dto.JobPostingDetailDto;
import com.nextstep.backend.job.dto.JobPostingDto;
import com.nextstep.backend.job.service.JobBookmarkService;
import com.nextstep.backend.job.service.JobPostingService;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class JobPostingController {

    private final JobPostingService service;
    private final JobBookmarkService bookmarkService;
    private final SecurityUtil securityUtil;

    public JobPostingController(JobPostingService service,
                                JobBookmarkService bookmarkService,
                                SecurityUtil securityUtil) {
        this.service         = service;
        this.bookmarkService = bookmarkService;
        this.securityUtil    = securityUtil;
    }

    @GetMapping("/jobs")
    public Page<JobPostingDto> getJobs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "") String employment,
            @RequestParam(defaultValue = "") String region,
            @RequestParam(defaultValue = "") String status,
            @RequestParam(defaultValue = "") String quickFilter,
            @RequestParam(defaultValue = "최신순") String sort) {
        Long memberId = securityUtil.getCurrentMemberIdOrNull();
        return service.getJobs(page, size, search, employment, region, status, quickFilter, sort, memberId);
    }

    @GetMapping("/jobs/{id}/bookmark")
    public ResponseEntity<Map<String, Object>> checkBookmark(@PathVariable Long id) {
        Long memberId = securityUtil.getCurrentMemberIdOrNull();
        boolean bookmarked = memberId != null && bookmarkService.isBookmarked(memberId, id);
        return ResponseEntity.ok(Map.of("bookmarked", bookmarked));
    }

    @PostMapping("/jobs/{id}/bookmark")
    public ResponseEntity<Map<String, Object>> toggleBookmark(@PathVariable Long id) {
        Long memberId = securityUtil.getCurrentMemberId();
        return ResponseEntity.ok(bookmarkService.toggle(memberId, id));
    }

    @GetMapping("/jobs/{id}")
    public JobPostingDetailDto getJobDetail(@PathVariable Long id) {
        return service.getJobDetail(id);
    }

    @PatchMapping("/jobs/{id}/view")
    public void incrementView(@PathVariable Long id) {
        service.incrementViewCount(id);
    }

    @PatchMapping("/jobs/{id}/status")
    public void updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        service.updateStatus(id, body.get("status"));
    }

    @GetMapping("/jobs/filters")
    public Map<String, List<String>> getFilters() {
        return service.getFilters();
    }

    @GetMapping("/jobs/count")
    public long countJobs() {
        return service.countJobs();
    }
}
