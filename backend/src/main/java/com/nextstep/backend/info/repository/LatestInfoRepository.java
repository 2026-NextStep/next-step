package com.nextstep.backend.info.repository;

import com.nextstep.backend.info.entity.LatestInfo;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

public interface LatestInfoRepository extends JpaRepository<LatestInfo, Long>, JpaSpecificationExecutor<LatestInfo> {
    Page<LatestInfo> findAll(Pageable pageable);

    List<LatestInfo> findTop60ByOrderByCreatedAtDesc();
}
