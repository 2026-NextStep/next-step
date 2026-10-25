package com.nextstep.backend.coverletter.controller;

import com.nextstep.backend.coverletter.dto.AiRequest;
import com.nextstep.backend.coverletter.dto.AiResponse;
import com.nextstep.backend.coverletter.dto.CoverLetterReviseRequest;
import com.nextstep.backend.coverletter.service.CoverLetterAiService;
import com.nextstep.backend.coverletter.service.OpenAIService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
public class AiController {

    private final OpenAIService openAIService;
    private final CoverLetterAiService coverLetterAiService;  // 추가

    // (기존) 단발성 OpenAI 첨삭 — 편집 화면은 더 이상 사용하지 않는다.
    @PostMapping("/feedback")
    public AiResponse getFeedback(
            @RequestBody AiRequest request
    ) throws Exception {

        return openAIService.getFeedback(
                request.getContent()
        );
    }

    // 추가: Gemini 자소서 첨삭 (ai-server 중계)
    // POST /api/v1/ai/cover-letter/revise
    @PostMapping("/cover-letter/revise")
    public Map<String, Object> reviseCoverLetter(
            @RequestBody CoverLetterReviseRequest request
    ) {
        return coverLetterAiService.revise(request);
    }
}