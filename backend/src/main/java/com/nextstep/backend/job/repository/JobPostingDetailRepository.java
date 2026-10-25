package com.nextstep.backend.job.repository;

import com.nextstep.backend.job.entity.JobPostingDetail;
import org.springframework.data.jpa.repository.JpaRepository;

public interface JobPostingDetailRepository extends JpaRepository<JobPostingDetail, Long> {
}
