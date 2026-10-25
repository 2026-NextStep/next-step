package com.nextstep.backend.coverletter.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ResumeRequest {

    private String username;    // 작성자
    private String title;       // 문서 제목
    private String company;     // 지원 회사
    private String position;    // 지원 직무
    private String description; // 자기소개 요약
    private String status;      // 완료 / 임시
    private String content;     // AI 편집용 전체 내용

    private List<QuestionAnswerDto> questions; // 문항별 질문/답변
}
