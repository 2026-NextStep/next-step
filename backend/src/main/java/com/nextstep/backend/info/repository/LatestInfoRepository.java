package com.nextstep.backend.info.repository;

import com.nextstep.backend.info.entity.LatestInfo;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LatestInfoRepository extends JpaRepository<LatestInfo, Long> {
    Page<LatestInfo> findAll(Pageable pageable);
}
