package com.nextstep.backend.member.controller;

import com.nextstep.backend.common.util.SecurityUtil;
import com.nextstep.backend.community.dto.FavoritePostResponseDto;
import com.nextstep.backend.community.service.BookmarkService;
import com.nextstep.backend.job.service.JobAiAnalysisService;
import com.nextstep.backend.job.service.JobBookmarkService;
import com.nextstep.backend.member.dto.MemberResponse;
import com.nextstep.backend.member.dto.MemberUpdateRequest;
import com.nextstep.backend.member.dto.PasswordChangeRequest;
import com.nextstep.backend.member.dto.ProfileImageResponse;
import com.nextstep.backend.member.service.MemberService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class MemberController {

    private final MemberService memberService;
    private final SecurityUtil securityUtil;
    private final BookmarkService bookmarkService;
    private final JobAiAnalysisService jobAiAnalysisService;
    private final JobBookmarkService jobBookmarkService;

    /** 내 정보 조회 */
    @GetMapping("/me")
    public ResponseEntity<MemberResponse> getMyInfo() {
        return ResponseEntity.ok(memberService.getMyInfo(securityUtil.getCurrentMemberId()));
    }

    /** 내 정보 수정 */
    @PatchMapping("/me")
    public ResponseEntity<MemberResponse> updateMyInfo(
            @Valid @RequestBody MemberUpdateRequest request
    ) {
        return ResponseEntity.ok(memberService.updateMyInfo(securityUtil.getCurrentMemberId(), request));
    }

    /** 비밀번호 변경 */
    @PostMapping("/me/password")
    public ResponseEntity<Void> changePassword(
            @Valid @RequestBody PasswordChangeRequest request
    ) {
        memberService.changePassword(securityUtil.getCurrentMemberId(), request);
        return ResponseEntity.ok().build();
    }

    /** 닉네임 중복 확인 (인증 불필요 — 회원가입 시에도 사용) */
    @GetMapping("/check-nickname")
    public ResponseEntity<Map<String, Boolean>> checkNicknameDuplicate(
            @RequestParam String nickname
    ) {
        return ResponseEntity.ok(Map.of("duplicate", memberService.isNicknameDuplicate(nickname)));
    }

    /** 프로필 이미지 업로드 */
    @PostMapping("/me/profile-image")
    public ResponseEntity<ProfileImageResponse> uploadProfileImage(
            @RequestParam("file") MultipartFile file
    ) {
        String path = memberService.uploadProfileImage(securityUtil.getCurrentMemberId(), file);
        return ResponseEntity.ok(new ProfileImageResponse(path));
    }

    /** 프로필 이미지 삭제 */
    @DeleteMapping("/me/profile-image")
    public ResponseEntity<Void> deleteProfileImage() {
        memberService.deleteProfileImage(securityUtil.getCurrentMemberId());
        return ResponseEntity.noContent().build();
    }

    /** 즐겨찾기한 커뮤니티 게시물 목록 조회 */
    @GetMapping("/me/favorites")
    public ResponseEntity<List<FavoritePostResponseDto>> getFavoritePosts() {
        MemberResponse me = memberService.getMyInfo(securityUtil.getCurrentMemberId());
        return ResponseEntity.ok(bookmarkService.getFavoritePostDetails(me.getNickname()));
    }

    /** 북마크한 채용공고 목록 조회 */
    @GetMapping("/me/bookmarks")
    public ResponseEntity<List<Map<String, Object>>> getBookmarkedPostings() {
        return ResponseEntity.ok(jobBookmarkService.getBookmarkedPostings(securityUtil.getCurrentMemberId()));
    }

    /** AI 요약/분석 저장 공고 목록 조회 */
    @GetMapping("/me/ai-analyses")
    public ResponseEntity<List<Map<String, Object>>> getAIAnalysisPostings() {
        return ResponseEntity.ok(jobAiAnalysisService.getByMember(securityUtil.getCurrentMemberId()));
    }
}