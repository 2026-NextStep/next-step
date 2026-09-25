package com.nextstep.backend.career.repository;

import com.nextstep.backend.career.entity.ProjectExperience;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ProjectExperienceRepository extends JpaRepository<ProjectExperience, Long> {
    List<ProjectExperience> findByMember_MemberIdOrderByCreatedAtAscIdAsc(Long memberId);
    Optional<ProjectExperience> findByIdAndMember_MemberId(Long id, Long memberId);

}

