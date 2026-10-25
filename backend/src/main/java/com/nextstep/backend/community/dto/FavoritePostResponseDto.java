package com.nextstep.backend.community.dto;

import com.nextstep.backend.community.entity.Post;
import lombok.Builder;
import lombok.Getter;

import java.time.format.DateTimeFormatter;

@Getter
@Builder
public class FavoritePostResponseDto {

    private Long postId;
    private String title;
    private String category;
    private String authorNickname;
    private String createdAt;
    private int likeCount;
    private int commentCount;

    public static FavoritePostResponseDto from(Post post) {
        return FavoritePostResponseDto.builder()
                .postId(post.getId())
                .title(post.getTitle())
                .category(post.getCategory())
                .authorNickname(post.getWriter())
                .createdAt(post.getCreatedAt() != null
                        ? post.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")) : "")
                .likeCount(post.getLikes())
                .commentCount(post.getCommentCount())
                .build();
    }
}
