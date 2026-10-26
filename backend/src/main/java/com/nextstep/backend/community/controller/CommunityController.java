package com.nextstep.backend.community.controller;

import com.nextstep.backend.common.util.SecurityUtil;
import com.nextstep.backend.community.dto.*;
import com.nextstep.backend.community.service.CommunityService;
import com.nextstep.backend.community.service.ReportService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/community")
@RequiredArgsConstructor
public class CommunityController {

    private final CommunityService communityService;
    private final ReportService    reportService;   // 추가
    private final SecurityUtil     securityUtil;    // 추가: 조회한 사람 식별용

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

    // 게시글 상세 (조회수 증가 + 댓글 포함). 같은 사람은 같은 글의 조회수를 하루에 한 번만 올린다.
    // 로그인 토큰이 같이 오면 "내가 좋아요를 눌렀는지"(liked)도 함께 내려준다.
    @GetMapping("/post/{id}")
    public PostDetailResponseDto getPost(@PathVariable Long id, HttpServletRequest request) {
        Long memberId = securityUtil.getCurrentMemberIdOrNull();
        return communityService.getPost(id, viewerKey(memberId, request), memberId);
    }

    // 좋아요 (한 사람이 한 글에 한 번만. 이미 눌렀으면 취소). 로그인한 사용자만 가능
    // 응답: { likes, liked }
    @PostMapping("/post/{id}/like")
    public Map<String, Object> toggleLike(@PathVariable Long id) {
        return communityService.toggleLike(id, securityUtil.getCurrentMemberId());
    }

    // 댓글 작성 (body 에 parentId 를 보내면 대댓글)
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

    // 조회한 사람을 구분하는 값: 로그인했으면 회원 번호, 아니면 접속 IP
    // (로그인 상태로 조회하려면 요청에 로그인 토큰이 함께 와야 한다)
    private String viewerKey(Long memberId, HttpServletRequest request) {
        if (memberId != null) {
            return "M:" + memberId;
        }

        String forwarded = request.getHeader("X-Forwarded-For");
        String ip = (forwarded != null && !forwarded.isBlank())
                ? forwarded.split(",")[0].trim()
                : request.getRemoteAddr();
        if (ip.length() > 45) {
            ip = ip.substring(0, 45); // IPv6 최대 길이. 이상한 값이 와도 컬럼 길이를 넘지 않게 자른다.
        }
        return "A:" + ip;
    }

    // 추가: 신고 (글 또는 댓글). 로그인한 사용자만 가능
    // POST /api/v1/community/report  { targetType: "POST"|"COMMENT", targetId, reason, detail }
    @PostMapping("/report")
    public ResponseEntity<Map<String, String>> report(@RequestBody ReportRequest request) {
        reportService.report(request);
        return ResponseEntity.ok(Map.of("message", "신고가 접수되었습니다."));
    }
}