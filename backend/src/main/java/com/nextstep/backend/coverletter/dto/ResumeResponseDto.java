package com.nextstep.backend.coverletter.dto;

import com.nextstep.backend.coverletter.entity.Resume;
import lombok.Getter;

import java.time.format.DateTimeFormatter;
import java.util.List;

@Getter
public class ResumeResponseDto {

    private Long   id;
    private String username;
    private String title;
    private String company;
    private String position;
    private String description;
    private String status;
    private String content;
    private String createdAt;
    private String updatedAt;

    private List<QuestionAnswerDto> questions;

    private static final DateTimeFormatter FMT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd");

    public ResumeResponseDto(Resume resume) {
        this.id          = resume.getId();
        this.username    = resume.getUsername();
        this.title       = resume.getTitle();
        this.company     = resume.getCompany();
        this.position    = resume.getPosition();
        this.description = resume.getDescription();
        this.status      = resume.getStatus();
        this.content     = resume.getContent();
        this.createdAt   = resume.getCreatedAt() != null
                ? resume.getCreatedAt().format(FMT) : "";
        this.updatedAt   = resume.getUpdatedAt() != null
                ? resume.getUpdatedAt().format(FMT) : "";
        this.questions   = resume.getQuestions().stream()
                .map(QuestionAnswerDto::new)
                .toList();
    }
}
