package com.nextstep.backend.community.dto;

import com.nextstep.backend.community.entity.Comment;
import lombok.Getter;

import java.time.format.DateTimeFormatter;

@Getter
public class CommentResponseDto {

    private Long   id;
    private String content;
    private String writer;
    private String writerRole; // ← 추가
    private String writerProfileImage;
    private String createdAt;

    private static final DateTimeFormatter FORMATTER =
            DateTimeFormatter.ofPattern("yyyy.MM.dd HH:mm");

    public CommentResponseDto(Comment comment) {
        this.id         = comment.getId();
        this.content    = comment.getContent();
        this.writer     = comment.getWriter();
        this.writerRole = comment.getWriterRole(); // ← 추가
        this.createdAt  = comment.getCreatedAt() != null
                ? comment.getCreatedAt().format(FORMATTER) : "";
    }

    public void setWriterProfileImage(String writerProfileImage) {
        this.writerProfileImage = writerProfileImage;
    }
}
