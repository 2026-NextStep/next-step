package com.nextstep.backend.career.service;

import com.nextstep.backend.career.dto.*;
import com.nextstep.backend.career.entity.*;
import com.nextstep.backend.career.repository.*;
import com.nextstep.backend.member.entity.Member;
import com.nextstep.backend.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CareerService {
    private final MemberSkillRepository skillRepository;
    private final ProjectExperienceRepository projectRepository;
    private final MemberRepository memberRepository;

    public List<SkillResponse> getSkills(Long memberId) {
        return skillRepository.findByMember_MemberIdOrderByCreatedAtAscIdAsc(memberId)
                .stream().map(SkillResponse::from).toList();
    }

    @Transactional
    public SkillResponse createSkill(Long memberId, SkillCreateRequest request) {
        String name = request.getName().strip();
        if (skillRepository.existsByMember_MemberIdAndNameIgnoreCase(memberId, name)) throw duplicateSkill();
        MemberSkill skill = MemberSkill.builder().member(member(memberId)).name(name)
                .proficiency(request.getProficiency()).build();
        return SkillResponse.from(skillRepository.saveAndFlush(skill));
    }

    @Transactional
    public SkillResponse updateSkill(Long memberId, Long id, SkillUpdateRequest request) {
        MemberSkill skill = ownedSkill(memberId, id);
        String name = request.getName() == null ? null : request.getName().strip();
        if (name != null && skillRepository.existsByMember_MemberIdAndNameIgnoreCaseAndIdNot(memberId, name, id))
            throw duplicateSkill();
        skill.update(name, request.getProficiency());
        skillRepository.flush();
        return SkillResponse.from(skill);
    }

    @Transactional
    public void deleteSkill(Long memberId, Long id) {
        skillRepository.delete(ownedSkill(memberId, id));
    }

    public List<ProjectExperienceResponse> getProjects(Long memberId) {
        return projectRepository.findByMember_MemberIdOrderByCreatedAtAscIdAsc(memberId)
                .stream().map(ProjectExperienceResponse::from).toList();
    }

    @Transactional
    public ProjectExperienceResponse createProject(Long memberId, ProjectExperienceCreateRequest request) {
        ProjectExperience project = ProjectExperience.builder().member(member(memberId))
                .name(request.getName().strip()).role(request.getRole())
                .technologies(request.getTechnologies()).description(request.getDescription()).build();
        return ProjectExperienceResponse.from(projectRepository.saveAndFlush(project));
    }

    @Transactional
    public ProjectExperienceResponse updateProject(Long memberId, Long id, ProjectExperienceUpdateRequest request) {
        ProjectExperience project = ownedProject(memberId, id);
        project.update(request.getName() == null ? null : request.getName().strip(),
                request.getRole(), request.getTechnologies(), request.getDescription());
        projectRepository.flush();
        return ProjectExperienceResponse.from(project);
    }

    @Transactional
    public void deleteProject(Long memberId, Long id) {
        projectRepository.delete(ownedProject(memberId, id));
    }

    private Member member(Long memberId) {
        return memberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalStateException("회원 정보를 찾을 수 없습니다."));
    }

    private MemberSkill ownedSkill(Long memberId, Long id) {
        return skillRepository.findByIdAndMember_MemberId(id, memberId).orElseThrow(this::notFound);
    }

    private ProjectExperience ownedProject(Long memberId, Long id) {
        return projectRepository.findByIdAndMember_MemberId(id, memberId).orElseThrow(this::notFound);
    }

    private ResponseStatusException notFound() {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "항목을 찾을 수 없습니다.");
    }

    private ResponseStatusException duplicateSkill() {
        return new ResponseStatusException(HttpStatus.CONFLICT, "이미 등록된 역량입니다.");
    }
}

