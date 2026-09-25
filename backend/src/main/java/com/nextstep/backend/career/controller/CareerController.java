package com.nextstep.backend.career.controller;

import com.nextstep.backend.career.dto.*;
import com.nextstep.backend.career.service.CareerService;
import com.nextstep.backend.common.util.SecurityUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import java.util.Map;

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

    // 기존 공용 예외 처리와 다른 팀 Controller에 영향을 주지 않는다.
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> handleStatus(ResponseStatusException e) {
        return ResponseEntity.status(e.getStatusCode()).body(Map.of("message", e.getReason()));
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class})
    public ResponseEntity<Map<String, String>> handleInvalidInput(Exception e) {
        return ResponseEntity.badRequest().body(Map.of("message", "요청 형식 또는 숙련도 값이 올바르지 않습니다."));
    }

    // 동시 등록 시에도 DB 고유 제약으로 중복을 막고 500 대신 충돌을 반환한다.
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, String>> handleConflict(DataIntegrityViolationException e) {
        return ResponseEntity.status(409).body(Map.of("message", "중복되거나 저장 조건에 맞지 않는 데이터입니다."));
    }
}

