package com.nextstep.backend.community.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CommentRequest {

    private String content;

    private String writer;

    // 대댓글이면 답글을 다는 대상 댓글의 id, 일반 댓글이면 null(보내지 않아도 됨)
    private Long parentId;
}