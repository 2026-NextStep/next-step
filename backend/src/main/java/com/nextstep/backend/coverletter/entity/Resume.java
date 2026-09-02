package com.nextstep.backend.coverletter.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
public class Resume {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username;    // 작성자

    private String title;       // 문서 제목

    private String company;     // 지원 회사

    private String position;    // 지원 직무

    @Column(columnDefinition = "TEXT")
    private String description; // 자기소개 요약

    private String status;      // 완료 / 임시

    @Column(columnDefinition = "LONGTEXT")
    private String content;     // AI 편집용 전체 내용

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @OneToMany(
            mappedBy = "resume",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<ResumeQuestion> questions = new ArrayList<>();
}
