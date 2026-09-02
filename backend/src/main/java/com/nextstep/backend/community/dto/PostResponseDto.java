package com.nextstep.backend.community.dto;

import com.nextstep.backend.community.entity.Post;
import lombok.Getter;

import java.time.format.DateTimeFormatter;

@Getter
public class PostResponseDto {

    private Long id;
    private String category;
    private String title;
    private String content;
    private String job;
    private String writer;
    private String writerRole; // ← 추가
    private String writerProfileImage;
    private String createdAt;
    private int views;
    private int likes;
    private int commentCount;
    private boolean hot;

    private static final DateTimeFormatter FORMATTER =
            DateTimeFormatter.ofPattern("yyyy.MM.dd");

    public PostResponseDto(Post post) {
        this.id           = post.getId();
        this.category     = post.getCategory();
        this.title        = post.getTitle();
        this.content      = post.getContent();
        this.job          = post.getJob();
        this.writer       = post.getWriter();
        this.writerRole   = post.getWriterRole(); // ← 추가
        this.createdAt    = post.getCreatedAt() != null
                ? post.getCreatedAt().format(FORMATTER) : "";
        this.views        = post.getViews();
        this.likes        = post.getLikes();
        this.commentCount = post.getCommentCount();
        this.hot          = post.getLikes() >= 50;
    }

    public void setWriterProfileImage(String writerProfileImage) {
        this.writerProfileImage = writerProfileImage;
    }
}
