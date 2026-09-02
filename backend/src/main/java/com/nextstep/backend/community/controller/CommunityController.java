package com.nextstep.backend.community.controller;

import com.nextstep.backend.community.dto.*;
import com.nextstep.backend.community.service.CommunityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/community")
@RequiredArgsConstructor
public class CommunityController {

    private final CommunityService communityService;

    // 게시글 작성
    @PostMapping("/post")
    public PostResponseDto createPost(@RequestBody PostRequest request) {
        return communityService.createPost(request);
    }

    // 게시글 목록
    @GetMapping("/posts")
    public PostListResponseDto getPosts(
            @RequestParam(defaultValue = "전체")  String category,
            @RequestParam(defaultValue = "최신순") String sort,
            @RequestParam(defaultValue = "")      String keyword,
            @RequestParam(defaultValue = "")      String job,
            @RequestParam(defaultValue = "0")     int page,
            @RequestParam(defaultValue = "10")    int size
    ) {
        return communityService.getPosts(category, sort, keyword, job, page, size);
    }

    // 게시글 상세 (조회수 자동 증가 + 댓글 포함)
    @GetMapping("/post/{id}")
    public PostDetailResponseDto getPost(@PathVariable Long id) {
        return communityService.getPost(id);
    }

    // 추천
    @PostMapping("/post/{id}/like")
    public Map<String, Integer> likePost(@PathVariable Long id) {
        int likes = communityService.likePost(id);
        return Map.of("likes", likes);
    }

    // 댓글 작성
    @PostMapping("/post/{id}/comment")
    public CommentResponseDto addComment(
            @PathVariable Long id,
            @RequestBody CommentRequest request
    ) {
        return communityService.addComment(id, request);
    }

    // ← 추가: 게시글 삭제
    @DeleteMapping("/post/{id}")
    public ResponseEntity<Void> deletePost(@PathVariable Long id) {
        communityService.deletePost(id);
        return ResponseEntity.ok().build();
    }

    // ← 추가: 댓글 삭제
    @DeleteMapping("/post/{postId}/comment/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable Long postId,
            @PathVariable Long commentId
    ) {
        communityService.deleteComment(postId, commentId);
        return ResponseEntity.ok().build();
    }
}
