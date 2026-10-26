package com.nextstep.backend.community.dto;

import com.nextstep.backend.community.entity.Comment;
import com.nextstep.backend.community.entity.Post;
import lombok.Getter;

import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;

@Getter
public class PostDetailResponseDto {

    private Long   id;
    private String category;
    private String title;
    private String content;
    private String job;
    private String writer;
    private String writerRole; // 조회할 때 서비스가 현재 역할로 덮어쓴다
    private String writerProfileImage;
    private String createdAt;
    private int    views;
    private int    likes;
    private boolean liked;     // 지금 보는 사람이 이 글에 좋아요를 눌렀는지 (비로그인이면 false)
    private int    commentCount;
    private boolean hot;

    private List<CommentResponseDto> comments;

    private static final DateTimeFormatter FORMATTER =
            DateTimeFormatter.ofPattern("yyyy.MM.dd");

    public PostDetailResponseDto(Post post) {
        this.id           = post.getId();
        this.category     = post.getCategory();
        this.title        = post.getTitle();
        this.content      = post.getContent();
        this.job          = post.getJob();
        this.writer       = post.getWriter();
        this.writerRole   = post.getWriterRole();
        this.createdAt    = post.getCreatedAt() != null
                ? post.getCreatedAt().format(FORMATTER) : "";
        this.views        = post.getViews();
        this.likes        = post.getLikes();
        this.commentCount = post.getCommentCount();
        this.hot          = post.getLikes() >= 50;
        // 작성 순서(id 순)로 정렬해서 내려준다. 화면이 이 순서대로 댓글 아래에 답글을 묶어 보여준다.
        this.comments     = post.getComments().stream()
                .sorted(Comparator.comparing(Comment::getId))
                .map(CommentResponseDto::new)
                .toList();
    }

    public void setLiked(boolean liked) {
        this.liked = liked;
    }

    public void setWriterRole(String writerRole) {
        this.writerRole = writerRole;
    }

    public void setWriterProfileImage(String writerProfileImage) {
        this.writerProfileImage = writerProfileImage;
    }
}