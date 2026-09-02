package com.nextstep.backend.coverletter.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
public class ResumeQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private int questionNumber; // 문항 번호 (1, 2, 3...)

    @Column(columnDefinition = "TEXT")
    private String question;    // 문항 내용

    @Column(columnDefinition = "LONGTEXT")
    private String answer;      // 답변

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resume_id")
    private Resume resume;
}
