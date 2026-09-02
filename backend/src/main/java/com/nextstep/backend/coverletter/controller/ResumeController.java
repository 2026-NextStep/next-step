package com.nextstep.backend.coverletter.controller;

import com.nextstep.backend.coverletter.dto.ResumeRequest;
import com.nextstep.backend.coverletter.dto.ResumeResponseDto;
import com.nextstep.backend.coverletter.service.ResumeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/resume")
@RequiredArgsConstructor
public class ResumeController {

    private final ResumeService resumeService;

    // 목록 조회 (사용자별)
    @GetMapping
    public List<ResumeResponseDto> getResumeList(
            @RequestParam String username
    ) {
        return resumeService.getResumeList(username);
    }

    // 상세 조회
    @GetMapping("/{id}")
    public ResponseEntity<ResumeResponseDto> getResume(
            @PathVariable Long id
    ) {
        ResumeResponseDto dto = resumeService.getResume(id);
        if (dto == null) return ResponseEntity.noContent().build();
        return ResponseEntity.ok(dto);
    }

    // 생성
    @PostMapping
    public ResumeResponseDto saveResume(
            @RequestBody ResumeRequest request
    ) {
        return resumeService.saveResume(request);
    }

    // 전체 수정
    @PutMapping("/{id}")
    public ResumeResponseDto updateResume(
            @PathVariable Long id,
            @RequestBody ResumeRequest request
    ) {
        return resumeService.updateResume(id, request);
    }

    // ← 추가: AI 편집 페이지용 title/content만 수정
    @PatchMapping("/{id}/content")
    public ResponseEntity<ResumeResponseDto> updateContent(
            @PathVariable Long id,
            @RequestBody Map<String, String> body
    ) {
        String title   = body.get("title");
        String content = body.get("content");
        ResumeResponseDto dto = resumeService.updateContent(id, title, content);
        return ResponseEntity.ok(dto);
    }

    // 삭제
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteResume(
            @PathVariable Long id
    ) {
        resumeService.deleteResume(id);
        return ResponseEntity.ok().build();
    }
}
