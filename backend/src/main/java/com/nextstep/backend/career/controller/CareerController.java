package com.nextstep.backend.career.controller;

import com.nextstep.backend.career.dto.*;
import com.nextstep.backend.career.service.CareerService;
import com.nextstep.backend.common.util.SecurityUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/users/me")
@RequiredArgsConstructor
public class CareerController {
    private final CareerService careerService;
    private final SecurityUtil securityUtil;

    @GetMapping("/dashboard-summary")
    public ResponseEntity<DashboardSummaryResponse> getDashboardSummary() {
        return ResponseEntity.ok(careerService.getDashboardSummary(securityUtil.getCurrentMemberId()));
    }

    @GetMapping("/skills")
    public ResponseEntity<List<SkillResponse>> getSkills() {
        return ResponseEntity.ok(careerService.getSkills(securityUtil.getCurrentMemberId()));
    }

    @PostMapping("/skills")
    public ResponseEntity<SkillResponse> createSkill(@Valid @RequestBody SkillCreateRequest request) {
        return ResponseEntity.ok(careerService.createSkill(securityUtil.getCurrentMemberId(), request));
    }

    @PatchMapping("/skills/{id}")
    public ResponseEntity<SkillResponse> updateSkill(@PathVariable Long id, @Valid @RequestBody SkillUpdateRequest request) {
        return ResponseEntity.ok(careerService.updateSkill(securityUtil.getCurrentMemberId(), id, request));
    }

    @DeleteMapping("/skills/{id}")
    public ResponseEntity<Void> deleteSkill(@PathVariable Long id) {
        careerService.deleteSkill(securityUtil.getCurrentMemberId(), id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/projects")
    public ResponseEntity<List<ProjectExperienceResponse>> getProjects() {
        return ResponseEntity.ok(careerService.getProjects(securityUtil.getCurrentMemberId()));
    }

    @PostMapping("/projects")
    public ResponseEntity<ProjectExperienceResponse> createProject(@Valid @RequestBody ProjectExperienceCreateRequest request) {
        return ResponseEntity.ok(careerService.createProject(securityUtil.getCurrentMemberId(), request));
    }

    @PatchMapping("/projects/{id}")
    public ResponseEntity<ProjectExperienceResponse> updateProject(@PathVariable Long id, @Valid @RequestBody ProjectExperienceUpdateRequest request) {
        return ResponseEntity.ok(careerService.updateProject(securityUtil.getCurrentMemberId(), id, request));
    }

    @DeleteMapping("/projects/{id}")
    public ResponseEntity<Void> deleteProject(@PathVariable Long id) {
        careerService.deleteProject(securityUtil.getCurrentMemberId(), id);
        return ResponseEntity.noContent().build();
    }
}

