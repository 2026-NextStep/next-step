package com.nextstep.backend.coverletter.agent;

import com.fasterxml.jackson.databind.ObjectMapper;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * OpenAI Chat Completions(JSON 모드)로 한 번 호출하고 JSON 트리를 돌려준다.
 * Gemini가 한도 초과·혼잡일 때 FallbackModelCaller가 대신 사용한다.
 *
 * 설정 (application.properties)
 *   openai.api-key     = OpenAI API 키 (기존 설정 재사용)
 *   openai.agent-model = 모델 이름 (생략하면 gpt-4o-mini)
 */
@Service
public class OpenAiModelCaller implements ModelCaller {

    private static final Logger log = LoggerFactory.getLogger(OpenAiModelCaller.class);

    private static final String URL = "https://api.openai.com/v1/chat/completions";
    private static final MediaType JSON_TYPE = MediaType.parse("application/json; charset=utf-8");

    @Value("${openai.api-key:}")
    private String apiKey;

    @Value("${openai.agent-model:gpt-4o-mini}")
    private String model;

    private final ObjectMapper mapper = new ObjectMapper();

    private final OkHttpClient client = new OkHttpClient.Builder()
            .connectTimeout(10, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .readTimeout(120, TimeUnit.SECONDS)
            .callTimeout(125, TimeUnit.SECONDS)
            .build();

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    @Override
    public Object callJson(String systemPrompt, String userPrompt, double temperature) {
        if (!isConfigured()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "OpenAI API 키가 설정되지 않았습니다. application.properties 의 openai.api-key 를 확인해 주세요.");
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", model);
        body.put("temperature", temperature);
        body.put("response_format", Map.of("type", "json_object"));
        body.put("messages", List.of(
                // JSON 모드는 메시지에 "JSON"이라는 단어가 있어야 하므로 한 번 더 명시
                Map.of("role", "system", "content", systemPrompt + "\n\nRespond with a single valid JSON object only."),
                Map.of("role", "user", "content", userPrompt)
        ));

        try {
            Request request = new Request.Builder()
                    .url(URL)
                    .header("Authorization", "Bearer " + apiKey)
                    .post(RequestBody.create(mapper.writeValueAsString(body), JSON_TYPE))
                    .build();

            try (Response response = client.newCall(request).execute()) {
                String text = response.body() != null ? response.body().string() : "";
                if (!response.isSuccessful()) {
                    log.error("OpenAI API 오류 status={} body={}", response.code(), AgentText.truncate(text, 300));
                    throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                            "AI 서비스가 지금 응답하지 못하고 있습니다(" + response.code() + "). 잠시 후 다시 시도해 주세요.");
                }
                Object root = mapper.readValue(text, Object.class);
                List<Object> choices = JsonTree.list(JsonTree.obj(root).get("choices"));
                Object message = choices.isEmpty() ? null : JsonTree.obj(choices.get(0)).get("message");
                String content = JsonTree.str(message, "content");
                if (content.isBlank()) {
                    throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                            "AI가 응답을 만들지 못했습니다. 내용을 조금 바꿔서 다시 시도해 주세요.");
                }
                return mapper.readValue(content, Object.class);
            }
        } catch (IOException e) {
            log.error("OpenAI 호출 실패 (연결/시간 초과/파싱): {}", e.toString());
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "AI 서버에 연결하지 못했거나 응답이 너무 늦습니다. 잠시 후 다시 시도해 주세요.");
        }
    }
}
