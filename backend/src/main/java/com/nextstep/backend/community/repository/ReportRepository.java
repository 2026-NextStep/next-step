package com.nextstep.backend.community.repository;

import com.nextstep.backend.community.entity.Report;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReportRepository
        extends JpaRepository<Report, Long> {

    // 같은 사람이 같은 대상을 이미 신고했는지
    boolean existsByReporterIdAndTargetTypeAndTargetId(Long reporterId, String targetType, Long targetId);
}