package com.nextstep.backend.common.util;

import java.util.Locale;
import java.util.regex.Pattern;

/**
 * 자소서의 지원 직무(자유 입력)를 커뮤니티 직종 목록(글쓰기 화면의 값과 같은 표기)으로 추정한다.
 * 맞출 수 없으면 "전체".
 *
 * 짧은 영어 약어(it, pr, pm ...)는 다른 단어 속에 들어 있는 경우(writer, product)를 걸러내기 위해
 * 앞뒤가 영어 알파벳이 아닐 때만 인정한다. (한글이 붙어 있는 건 허용: "IT개발")
 */
public class JobCategoryGuesser {

    private JobCategoryGuesser() {}

    public static final String IT        = "IT · 개발";
    public static final String DESIGN    = "디자인";
    public static final String PLANNING  = "기획 · 전략";
    public static final String MARKETING = "마케팅 · 홍보";
    public static final String FINANCE   = "회계 · 재무";
    public static final String SALES     = "영업";
    public static final String ALL       = "전체";

    private static Pattern of(String koreanOrLongWords, String shortTokens) {
        String regex = "(" + koreanOrLongWords + ")|(?<![a-z])(" + shortTokens + ")(?![a-z])";
        return Pattern.compile(regex);
    }

    private static final Pattern P_IT = of(
            "개발|엔지니어|프로그래|백엔드|프론트|서버|데이터|소프트웨어|보안|인프라|클라우드|developer|engineer|backend|frontend|fullstack|devops|software|data",
            "it|sw");
    private static final Pattern P_DESIGN = of(
            "디자|design",
            "ui|ux");
    private static final Pattern P_MARKETING = of(
            "마케팅|홍보|광고|브랜드|marketing|brand",
            "pr");
    private static final Pattern P_PLANNING = of(
            "기획|전략|프로덕트|product|planner|strategy",
            "pm|po");
    private static final Pattern P_FINANCE = of(
            "회계|재무|세무|경리|finance|accounting",
            "cpa");
    private static final Pattern P_SALES = of(
            "영업|세일즈|sales",
            "bd");

    public static String guess(String position) {
        if (position == null || position.isBlank()) return ALL;
        String p = position.toLowerCase(Locale.ROOT);

        if (P_IT.matcher(p).find())        return IT;
        if (P_DESIGN.matcher(p).find())    return DESIGN;
        if (P_MARKETING.matcher(p).find()) return MARKETING;
        if (P_PLANNING.matcher(p).find())  return PLANNING;
        if (P_FINANCE.matcher(p).find())   return FINANCE;
        if (P_SALES.matcher(p).find())     return SALES;
        return ALL;
    }
}