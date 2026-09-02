package com.nextstep.backend.coverletter.dto;

import com.nextstep.backend.coverletter.entity.ResumeQuestion;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class QuestionAnswerDto {

    private int    questionNumber;
    private String question;
    private String answer;

    // 엔티티 → DTO 변환용 생성자
    public QuestionAnswerDto(ResumeQuestion q) {
        this.questionNumber = q.getQuestionNumber();
        this.question       = q.getQuestion();
        this.answer         = q.getAnswer();
    }

    // 역직렬화용 기본 생성자
    public QuestionAnswerDto() {}
}
