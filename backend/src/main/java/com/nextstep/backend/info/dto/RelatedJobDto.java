package com.nextstep.backend.info.dto;

import com.nextstep.backend.job.dto.JobPostingDto;

/** 최신정보 상세에 붙는 관련 채용공고 — 공고 정보 + 연결된 이유. */
public class RelatedJobDto {

    private final JobPostingDto job;
    private final String reason;

    public RelatedJobDto(JobPostingDto job, String reason) {
        this.job    = job;
        this.reason = reason;
    }

    public JobPostingDto getJob() { return job; }
    public String getReason()     { return reason; }
}
