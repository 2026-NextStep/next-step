package com.nextstep.backend.community.dto;

import lombok.Getter;

import java.util.List;

@Getter
public class PostListResponseDto {

    private List<PostResponseDto> posts;
    private long totalCount;  // 전체 게시글 수
    private int totalPages;   // 전체 페이지 수
    private int currentPage;  // 현재 페이지

    public PostListResponseDto(
            List<PostResponseDto> posts,
            long totalCount,
            int totalPages,
            int currentPage
    ) {
        this.posts       = posts;
        this.totalCount  = totalCount;
        this.totalPages  = totalPages;
        this.currentPage = currentPage;
    }
}
