package com.nextstep.backend.community.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CommentRequest {

    private String content;

    private String writer;
}
