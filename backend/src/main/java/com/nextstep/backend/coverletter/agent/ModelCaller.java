package com.nextstep.backend.coverletter.agent;

/** 언어 모델을 한 번 불러 JSON 답을 받는다. (구현: GeminiClient) 반환값은 Map/List/문자열/숫자로 이루어진 JSON 트리 */
public interface ModelCaller {

    Object callJson(String systemPrompt, String userPrompt, double temperature);
}