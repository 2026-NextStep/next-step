package com.nextstep.backend.job.controller;

import com.nextstep.backend.common.util.SecurityUtil;
import com.nextstep.backend.job.service.JobAiAnalysisService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/jobs")
public class JobAiAnalysisController {

    private final JobAiAnalysisService service;
    private final SecurityUtil securityUtil;

    public JobAiAnalysisController(JobAiAnalysisService service, SecurityUtil securityUtil) {
        this.service = service;
        this.securityUtil = securityUtil;
    }

    @GetMapping(value = "/{jobId}/ai-analysis", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> getAnalysis(@PathVariable Long jobId) {
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(service.getOrCreate(jobId));
    }

    @PostMapping("/{postingId}/save")
    public ResponseEntity<Void> saveAnalysis(@PathVariable Long postingId) {
        service.saveForMember(postingId, securityUtil.getCurrentMemberId());
        return ResponseEntity.ok().build();
    }
}
