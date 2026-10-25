package com.nextstep.backend.community.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PostRequest {

    private String category; // 자소서 / 면접 / 기업 질문 / 자유 게시판

    private String title;

    private String content;

    private String job;     // 직종

    private String writer;
}
