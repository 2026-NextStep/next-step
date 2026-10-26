package com.nextstep.backend.coverletter.agent;

/**
 * "AI 가 댄 근거 구절이 정말 그 문서에 있는가"를 서버가 직접 확인한다.
 *
 * AI 의 말(근거 있음)을 믿지 않고, 인용한 구절을 원문에서 찾아본다.
 * 띄어쓰기·문장부호·따옴표 차이는 무시하고(글자와 숫자만 비교), 다른 말로 바꿔 쓴 구절은 인정하지 않는다.
 */
public final class EvidenceVerifier {

    /** 이보다 짧은 인용은 우연히 일치할 수 있어서 근거로 인정하지 않는다 (공백·부호 제외 글자 수) */
    public static final int MIN_QUOTE_LENGTH = 6;

    private EvidenceVerifier() {}

    /** 글자와 숫자만 남기고 소문자로 맞춘다. "Spring  Boot," → "springboot" */
    public static String normalize(String s) {
        if (s == null) return "";
        StringBuilder sb = new StringBuilder(s.length());
        for (int i = 0; i < s.length(); i++) {
            char ch = s.charAt(i);
            if (Character.isLetterOrDigit(ch)) {
                sb.append(Character.toLowerCase(ch));
            }
        }
        return sb.toString();
    }

    /**
     * quote 가 source 안에 실제로 있는지.
     * 인용에 "…"/"..."이 있으면 그걸 기준으로 나눠, 의미 있는 길이의 조각이 모두 순서와 상관없이 원문에 있어야 한다.
     */
    public static boolean appearsIn(String quote, String source) {
        if (quote == null || quote.isBlank() || source == null || source.isBlank()) {
            return false;
        }
        String normalizedSource = normalize(source);

        int checked = 0;
        for (String part : quote.split("…|\\.{3}")) {
            String n = normalize(part);
            if (n.length() < MIN_QUOTE_LENGTH) continue;   // 너무 짧은 조각은 판단 대상에서 뺀다
            checked++;
            if (!normalizedSource.contains(n)) return false;
        }
        return checked > 0;
    }
}