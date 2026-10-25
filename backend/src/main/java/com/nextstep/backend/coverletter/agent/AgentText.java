package com.nextstep.backend.coverletter.agent;

/** 에이전트가 쓰는 문자열 도구 모음 */
public final class AgentText {

    private AgentText() {}

    public static String nullToEmpty(String s) {
        return s == null ? "" : s;
    }

    public static String truncate(String s, int max) {
        String v = nullToEmpty(s);
        return v.length() <= max ? v : v.substring(0, max);
    }

    /**
     * DB 에 JSON 문자열로 저장된 공고 항목(["가","나"] 같은 모양)을 사람이 읽는 문장으로 편다.
     * 괄호/따옴표를 공백으로 바꾸고 연속 공백을 하나로 줄인다.
     */
    public static String flattenJson(String raw) {
        if (raw == null || raw.isBlank()) return "";
        return raw.replaceAll("[\\[\\]{}\"]", " ").replaceAll("\\s+", " ").trim();
    }
}