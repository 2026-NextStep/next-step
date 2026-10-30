package com.nextstep.backend.coverletter.agent;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.concurrent.atomic.AtomicLong;

/**
 * Gemini 우선, 실패 시 OpenAI로 자동 전환하는 ModelCaller (Agent가 실제로 주입받는 구현).
 *
 * Gemini 무료 키는 하루 한도가 작고, 같은 키를 AI 서버(최신정보 수집·맞춤 소식 등)도 함께 써서
 * 한도 초과(429)·혼잡(503)이 잦다. Agent는 첨삭 1번에 모델을 여러 번 부르므로,
 * Gemini가 한 번 실패하면 일정 시간 동안은 Gemini를 건너뛰고 바로 OpenAI를 써서 매번 재시도로 느려지지 않게 한다.
 */
@Primary
@Service
public class FallbackModelCaller implements ModelCaller {

    private static final Logger log = LoggerFactory.getLogger(FallbackModelCaller.class);
    private static final long GEMINI_COOLDOWN_MS = 5 * 60 * 1000;

    private final GeminiClient gemini;
    private final OpenAiModelCaller openai;
    private final AtomicLong skipGeminiUntil = new AtomicLong(0);

    public FallbackModelCaller(GeminiClient gemini, OpenAiModelCaller openai) {
        this.gemini = gemini;
        this.openai = openai;
    }

    @Override
    public Object callJson(String systemPrompt, String userPrompt, double temperature) {
        if (System.currentTimeMillis() >= skipGeminiUntil.get()) {
            try {
                return gemini.callJson(systemPrompt, userPrompt, temperature);
            } catch (ResponseStatusException e) {
                if (!openai.isConfigured()) throw e;  // 대신할 모델이 없으면 원래 오류 그대로
                skipGeminiUntil.set(System.currentTimeMillis() + GEMINI_COOLDOWN_MS);
                log.warn("Gemini 호출 실패 → OpenAI로 전환 (5분간 Gemini 건너뜀): {}", e.getReason());
            }
        }
        return openai.callJson(systemPrompt, userPrompt, temperature);
    }
}
