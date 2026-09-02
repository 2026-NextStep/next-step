package com.nextstep.backend.coverletter.controller;

import com.nextstep.backend.coverletter.dto.AiRequest;
import com.nextstep.backend.coverletter.dto.AiResponse;
import com.nextstep.backend.coverletter.service.OpenAIService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
public class AiController {

    private final OpenAIService openAIService;

    @PostMapping("/feedback")
    public AiResponse getFeedback(
            @RequestBody AiRequest request
    ) throws Exception {

        return openAIService.getFeedback(
                request.getContent()
        );
    }
}
