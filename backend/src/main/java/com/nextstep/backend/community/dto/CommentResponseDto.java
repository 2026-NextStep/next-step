package com.nextstep.backend.community.dto;

import com.nextstep.backend.community.entity.Comment;
import lombok.Getter;

import java.time.format.DateTimeFormatter;

@Getter
public class CommentResponseDto {

    private Long   id;
    private Long   parentId;   // 대댓글이면 부모 댓글 id, 일반 댓글이면 null
    private boolean deleted;   // 삭제된 댓글 여부 (답글이 달려 있어서 자리만 남긴 경우)
    private String content;
    private String writer;
    private String writerRole; // 조회할 때 서비스가 현재 역할로 덮어쓴다
    private String writerProfileImage;
    private String createdAt;

    private static final DateTimeFormatter FORMATTER =
            DateTimeFormatter.ofPattern("yyyy.MM.dd HH:mm");

    public CommentResponseDto(Comment comment) {
        this.id        = comment.getId();
        this.parentId  = comment.getParentId();
        this.deleted   = comment.isDeleted();
        this.createdAt = comment.getCreatedAt() != null
                ? comment.getCreatedAt().format(FORMATTER) : "";

        if (comment.isDeleted()) {
            // 삭제된 댓글은 원래 내용과 작성자를 API로도 내보내지 않는다.
            this.content    = "삭제된 댓글입니다.";
            this.writer     = "";
            this.writerRole = null;
        } else {
            this.content    = comment.getContent();
            this.writer     = comment.getWriter();
            this.writerRole = comment.getWriterRole();
        }
    }

    public void setWriterRole(String writerRole) {
        this.writerRole = writerRole;
    }

    public void setWriterProfileImage(String writerProfileImage) {
        this.writerProfileImage = writerProfileImage;
    }
}