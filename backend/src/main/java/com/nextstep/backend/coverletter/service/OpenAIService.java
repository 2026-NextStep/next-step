package com.nextstep.backend.coverletter.service;

import com.nextstep.backend.coverletter.dto.AiResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import okhttp3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.util.concurrent.TimeUnit;

@Service
public class OpenAIService {

    @Value("${openai.api-key}")
    private String apiKey;

    OkHttpClient client = new OkHttpClient.Builder()
            .connectTimeout(60, TimeUnit.SECONDS)
            .readTimeout(60, TimeUnit.SECONDS)
            .writeTimeout(60, TimeUnit.SECONDS)
            .build();

    private final ObjectMapper mapper = new ObjectMapper();

    public AiResponse getFeedback(String content) throws Exception {

        String prompt = """
                너는 대기업 자소서 전문 첨삭가다.

                아래 자기소개서를 첨삭해라.

                1. 장점
                2. 문제점
                3. 개선 방향
                4. 수정 예시

                자기소개서:
                """ + content;

        String requestBody = """
                {
                  "model": "gpt-4.1-mini",
                  "messages": [
                    {
                      "role": "user",
                      "content": %s
                    }
                  ]
                }
                """.formatted(
                mapper.writeValueAsString(prompt)
        );

        Request request = new Request.Builder()
                .url("https://api.openai.com/v1/chat/completions")
                .addHeader("Authorization", "Bearer " + apiKey)
                .addHeader("Content-Type", "application/json")
                .post(
                        RequestBody.create(
                                requestBody,
                                MediaType.parse("application/json")
                        )
                )
                .build();

        Response response = client.newCall(request).execute();

        String responseText = response.body().string();

        JsonNode jsonNode = mapper.readTree(responseText);

        String feedback = jsonNode
                .get("choices")
                .get(0)
                .get("message")
                .get("content")
                .asText();

        return new AiResponse(feedback);
    }
}
