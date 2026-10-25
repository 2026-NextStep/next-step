package com.nextstep.backend.coverletter.service;

import com.nextstep.backend.coverletter.dto.QuestionAnswerDto;
import com.nextstep.backend.coverletter.dto.ResumeRequest;
import com.nextstep.backend.coverletter.dto.ResumeResponseDto;
import com.nextstep.backend.coverletter.entity.Resume;
import com.nextstep.backend.coverletter.entity.ResumeQuestion;
import com.nextstep.backend.coverletter.repository.ResumeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ResumeService {

    private final ResumeRepository resumeRepository;

    // 목록 조회 (사용자별)
    public List<ResumeResponseDto> getResumeList(String username) {
        return resumeRepository
                .findByUsernameOrderByUpdatedAtDesc(username)
                .stream()
                .map(ResumeResponseDto::new)
                .toList();
    }

    // 상세 조회
    @Transactional
    public ResumeResponseDto getResume(Long id) {
        Resume resume = resumeRepository.findById(id).orElse(null);
        if (resume == null) return null;
        return new ResumeResponseDto(resume);
    }

    // 새로 생성
    @Transactional
    public ResumeResponseDto saveResume(ResumeRequest request) {
        Resume resume = new Resume();
        setResumeFields(resume, request);
        resume.setCreatedAt(LocalDateTime.now());
        resume.setUpdatedAt(LocalDateTime.now());
        saveQuestions(resume, request);
        return new ResumeResponseDto(resumeRepository.save(resume));
    }

    // 전체 수정
    @Transactional
    public ResumeResponseDto updateResume(Long id, ResumeRequest request) {
        Resume resume = resumeRepository.findById(id).orElseThrow();
        setResumeFields(resume, request);
        resume.setUpdatedAt(LocalDateTime.now());
        resume.getQuestions().clear();
        resumeRepository.save(resume);
        saveQuestions(resume, request);
        return new ResumeResponseDto(resumeRepository.save(resume));
    }

    // AI 편집 페이지용 title/content만 수정
    @Transactional
    public ResumeResponseDto updateContent(Long id, String title, String content) {
        Resume resume = resumeRepository.findById(id).orElseThrow();
        if (title   != null) resume.setTitle(title);
        if (content != null) resume.setContent(content);
        resume.setUpdatedAt(LocalDateTime.now());
        return new ResumeResponseDto(resumeRepository.save(resume));
    }

    // ← 삭제 수정: findById 후 delete로 cascade 보장
    @Transactional
    public void deleteResume(Long id) {
        Resume resume = resumeRepository.findById(id).orElseThrow();
        resumeRepository.delete(resume);
    }

    // ── 내부 헬퍼 ──────────────────────────────────────
    private void setResumeFields(Resume resume, ResumeRequest req) {
        resume.setUsername(req.getUsername());
        resume.setTitle(req.getTitle());
        resume.setCompany(req.getCompany());
        resume.setPosition(req.getPosition());
        resume.setDescription(req.getDescription());
        resume.setStatus(req.getStatus() != null ? req.getStatus() : "임시");
        resume.setContent(req.getContent());
    }

    private void saveQuestions(Resume resume, ResumeRequest req) {
        if (req.getQuestions() == null) return;
        for (QuestionAnswerDto dto : req.getQuestions()) {
            ResumeQuestion q = new ResumeQuestion();
            q.setQuestionNumber(dto.getQuestionNumber());
            q.setQuestion(dto.getQuestion());
            q.setAnswer(dto.getAnswer());
            q.setResume(resume);
            resume.getQuestions().add(q);
        }
    }
}
