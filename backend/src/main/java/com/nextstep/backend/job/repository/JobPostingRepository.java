package com.nextstep.backend.job.repository;

import com.nextstep.backend.job.entity.JobPosting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface JobPostingRepository extends JpaRepository<JobPosting, Long>, JpaSpecificationExecutor<JobPosting> {

    @Modifying
    @Transactional
    @Query("UPDATE JobPosting j SET j.viewCount = j.viewCount + 1 WHERE j.postingId = :id")
    void incrementViewCount(@Param("id") Long id);

    @Modifying
    @Transactional
    @Query("UPDATE JobPosting j SET j.scrapCount = j.scrapCount + 1 WHERE j.postingId = :id")
    void incrementScrapCount(@Param("id") Long id);

    @Modifying
    @Transactional
    @Query("UPDATE JobPosting j SET j.scrapCount = CASE WHEN j.scrapCount > 0 THEN j.scrapCount - 1 ELSE 0 END WHERE j.postingId = :id")
    void decrementScrapCount(@Param("id") Long id);

    @Modifying
    @Transactional
    @Query("UPDATE JobPosting j SET j.status = :status WHERE j.postingId = :id")
    void updateStatus(@Param("id") Long id, @Param("status") String status);

    @Query("SELECT DISTINCT j.employmentType FROM JobPosting j WHERE j.employmentType IS NOT NULL")
    List<String> findDistinctEmploymentTypes();

    @Query("SELECT DISTINCT j.workLocation FROM JobPosting j WHERE j.workLocation IS NOT NULL")
    List<String> findDistinctWorkLocations();
}
