package com.nextstep.backend.community.controller;

import com.nextstep.backend.community.dto.PostResponseDto;
import com.nextstep.backend.community.service.ResumeShareService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/community")
@RequiredArgsConstructor
public class ResumeShareController {

    private final ResumeShareService resumeShareService;

    // 내 자소서를 커뮤니티에 첨삭 요청글로 올린다. 로그인한 사용자만 가능
    // POST /api/v1/community/post/from-resume/{resumeId}
    @PostMapping("/post/from-resume/{resumeId}")
    public PostResponseDto shareResume(@PathVariable Long resumeId) {
        return resumeShareService.shareToCommunity(resumeId);
    }
}