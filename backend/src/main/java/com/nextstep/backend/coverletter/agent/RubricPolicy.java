package com.nextstep.backend.coverletter.agent;

import com.nextstep.backend.coverletter.agent.AgentModels.Evaluation;
import com.nextstep.backend.coverletter.agent.AgentModels.Issue;

/**
 * 평가 기준(루브릭). "기준 통과/미달"은 AI 가 아니라 이 규칙으로 서버가 정한다.
 */
public final class RubricPolicy {

    private RubricPolicy() {}

    public static final int MIN_RELEVANCE    = 70;  // 직무 연관성
    public static final int MIN_COMPLETENESS = 70;  // 문맥/완성도
    public static final int MAX_REWRITE_ROUNDS = 2; // 자가수정 최대 횟수

    public static final String TYPE_FACT      = "FACT";
    public static final String TYPE_STRUCTURE = "STRUCTURE";
    public static final String TYPE_RELEVANCE = "RELEVANCE";
    public static final String TYPE_STYLE     = "STYLE";

    public static int clampScore(int v) {
        return Math.max(0, Math.min(100, v));
    }

    /**
     * 고쳐 써야 하는가.
     *  - 근거를 확인하지 못한 주장이 하나라도 있으면
     *  - 직무 연관성 또는 문맥/완성도가 기준 미만이면
     *  - 지금 가진 자료만으로 고칠 수 있는(fixable) 사실·구조 문제가 지적됐으면
     * 사용자가 정보를 더 줘야만 해결되는 문제(fixable=false)는 다시 써도 소용없으므로 "보완 필요"로만 안내한다.
     */
    public static boolean needsRewrite(Evaluation e, int unverifiedClaims) {
        if (unverifiedClaims > 0) return true;
        if (e.relevance() < MIN_RELEVANCE || e.completeness() < MIN_COMPLETENESS) return true;
        for (Issue issue : e.issues()) {
            boolean serious = TYPE_FACT.equals(issue.type()) || TYPE_STRUCTURE.equals(issue.type());
            if (issue.fixable() && serious) return true;
        }
        return false;
    }

    /** 고쳐 쓴 결과와 이전 결과 중 어느 쪽이 나은지 비교하는 점수 (높을수록 좋음) */
    public static int qualityScore(Evaluation e, int unverifiedClaims) {
        int fixable = 0;
        for (Issue issue : e.issues()) {
            if (issue.fixable()) fixable++;
        }
        return e.relevance() + e.completeness() - 40 * unverifiedClaims - 10 * fixable;
    }

    /** 리포트에 그대로 보여줄 평가 기준 설명 */
    public static String describe() {
        return "상황(S)·과제(T)·행동(A)·결과(R) 4요소 / 직무 연관성 " + MIN_RELEVANCE + "점 이상 / "
                + "문맥·완성도 " + MIN_COMPLETENESS + "점 이상 / 인용 근거가 원문에서 모두 확인될 것";
    }
}