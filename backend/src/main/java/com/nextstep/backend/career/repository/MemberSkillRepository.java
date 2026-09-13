package com.nextstep.backend.career.repository;

import com.nextstep.backend.career.entity.MemberSkill;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface MemberSkillRepository extends JpaRepository<MemberSkill, Long> {
    List<MemberSkill> findByMember_MemberIdOrderByCreatedAtAscIdAsc(Long memberId);
    Optional<MemberSkill> findByIdAndMember_MemberId(Long id, Long memberId);
    boolean existsByMember_MemberIdAndNameIgnoreCase(Long memberId, String name);
    boolean existsByMember_MemberIdAndNameIgnoreCaseAndIdNot(Long memberId, String name, Long id);
}

