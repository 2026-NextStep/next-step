package com.nextstep.backend.coverletter.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

/**
 * AI 첨삭 요청. 편집 화면의 문항(원문)과 채팅창 요청사항, 올린 문서 정보를 담는다.
 */
@Getter
@Setter
public class CoverLetterReviseRequest {

    private List<QuestionAnswerDto> questions; // 문항별 질문/원문 답변
    private String request;                    // 채팅창에 입력한 요청사항 (없으면 빈 값)
    private String company;                    // 지원 회사
    private String position;                   // 지원 직무

    private String reference;                  // 올린 문서(PDF)에서 추출한 텍스트
    private String referenceName;              // 올린 문서 파일 이름 (출처 표시용)
    private String referenceType;              // "JD"(채용공고) 또는 "RESUME"(내 이력서). 기본은 JD

    private Long jobPostingId;                 // 직접 고른 채용공고 (없으면 회사 이름으로 자동 연결 시도)
}