package com.nextstep.backend.coverletter.controller;

import com.nextstep.backend.common.ratelimit.RateLimiter;
import com.nextstep.backend.common.util.SecurityUtil;
import com.nextstep.backend.coverletter.dto.AiRequest;
import com.nextstep.backend.coverletter.dto.AiResponse;
import com.nextstep.backend.coverletter.dto.CoverLetterReviseRequest;
import com.nextstep.backend.coverletter.service.CoverLetterAiService;
import com.nextstep.backend.coverletter.service.OpenAIService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
public class AiController {

    private final OpenAIService openAIService;
    private final CoverLetterAiService coverLetterAiService;  // 추가
    private final SecurityUtil securityUtil;
    private final RateLimiter rateLimiter;

    // AI 호출은 비용이 들어 로그인 필수 + 회원당 하루 횟수 제한 (첨삭 API 두 개가 같은 한도를 공유)
    @Value("${ratelimit.ai.per-day:30}")
    private int aiPerDay;

    // (기존) 단발성 OpenAI 첨삭 — 편집 화면은 더 이상 사용하지 않는다.
    @PostMapping("/feedback")
    public AiResponse getFeedback(
            @RequestBody AiRequest request
    ) throws Exception {
        String key = acquireAiLimit();
        try {
            return openAIService.getFeedback(
                    request.getContent()
            );
        } catch (Exception e) {
            rateLimiter.refund(key);  // 결과를 못 받았으면 횟수를 돌려준다
            throw e;
        }
    }

    // 추가: Gemini 자소서 첨삭 (ai-server 중계)
    // POST /api/v1/ai/cover-letter/revise
    @PostMapping("/cover-letter/revise")
    public Map<String, Object> reviseCoverLetter(
            @RequestBody CoverLetterReviseRequest request
    ) {
        String key = acquireAiLimit();
        try {
            return coverLetterAiService.revise(request);
        } catch (RuntimeException e) {
            rateLimiter.refund(key);  // 입력 오류·AI 장애로 결과를 못 받았으면 횟수를 돌려준다
            throw e;
        }
    }

    private String acquireAiLimit() {
        Long memberId = securityUtil.getCurrentMemberId();  // 비로그인 시 403
        String key = "ai:" + memberId;
        rateLimiter.acquire(key, aiPerDay, Duration.ofDays(1),
                "오늘 AI 첨삭 사용 횟수(" + aiPerDay + "회)를 모두 사용했어요. 내일 다시 이용해 주세요.");
        return key;
    }
}
