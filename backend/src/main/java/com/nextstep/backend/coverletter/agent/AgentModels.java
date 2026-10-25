package com.nextstep.backend.coverletter.agent;

import java.util.List;

/** AI 에이전트가 주고받는 데이터 모양 모음 (스프링/Jackson 과 무관한 순수 자바) */
public final class AgentModels {

    private AgentModels() {}

    // ── 출처 종류 ──
    public static final String SRC_JOB_POSTING     = "JOB_POSTING";      // 연결된 채용공고
    public static final String SRC_REFERENCE_JD    = "REFERENCE_JD";     // 올린 문서(채용공고)
    public static final String SRC_REFERENCE_RESUME = "REFERENCE_RESUME"; // 올린 문서(내 이력서) — 지원자 사실의 근거로 쓸 수 있음
    public static final String SRC_ORIGINAL        = "ORIGINAL";         // 지원자가 쓴 원문
    public static final String SRC_RUBRIC          = "RUBRIC";           // 평가 기준

    /** 첨삭 대상 문항 */
    public record Question(int number, String question, String answer) {
        public boolean hasAnswer() {
            return answer != null && !answer.isBlank();
        }
    }

    /**
     * 직무 기준이 되는 문서(채용공고, 올린 JD/이력서)의 본문.
     * isFactSource 가 true 인 문서(내 이력서)만 "지원자가 실제로 한 일"의 근거로 인정한다.
     * 채용공고는 회사가 원하는 조건일 뿐 지원자의 경험이 아니기 때문이다.
     */
    public record SourceText(String id, String type, String title, String detail, String url, String text) {
        public boolean isFactSource() {
            return SRC_REFERENCE_RESUME.equals(type);
        }
    }

    public record AgentInput(List<Question> questions, String userRequest, String company, String position,
                             List<SourceText> sourceTexts) {}

    /** 화면에 보여줄 출처 한 건 */
    public record Source(String id, String type, String title, String detail, String url) {}

    // ── 1단계: 공고 분석 ──
    public record Keyword(String text, String sourceId, String quote, boolean verified) {}

    public record JobAnalysis(List<Keyword> core, List<Keyword> preferred, String note) {}

    // ── 2단계: STAR 작성 ──
    /** 수정본이 내세우는 사실 하나와, AI 가 댄 근거 구절 */
    public record Claim(String text, String quote) {}

    public record Draft(int number, String revised, String changeNote, List<Claim> claims, List<String> needFromUser) {}

    /** 서버가 근거 구절을 원문에서 직접 찾아본 결과. verified=false 면 sourceId 는 null */
    public record VerifiedClaim(int questionNumber, String text, String sourceId, String quote, boolean verified) {}

    /** 자가수정 때 AI 에게 넘기는 정보: 이전 수정본 + 무엇이 문제였는지 */
    public record Rewrite(String previousRevised, String feedback) {}

    // ── 3단계: 면접관 평가 ──
    public record Star(boolean situation, boolean task, boolean action, boolean result) {
        public boolean all() {
            return situation && task && action && result;
        }

        public List<String> missing() {
            java.util.ArrayList<String> out = new java.util.ArrayList<>();
            if (!situation) out.add("상황(S)");
            if (!task)      out.add("과제(T)");
            if (!action)    out.add("행동(A)");
            if (!result)    out.add("결과(R)");
            return out;
        }
    }

    public record Issue(String type, String detail, boolean fixable) {}

    public record Evaluation(int number, int relevance, int completeness, Star star, List<Issue> issues, String comment) {}

    // ── 결과 ──
    public record QuestionResult(int number, String revised, String changeNote,
                                 int relevance, int completeness, Star star,
                                 List<Issue> issues, List<VerifiedClaim> claims, List<String> needFromUser,
                                 boolean passed, int rewrites) {}

    /** 에이전트가 거친 라운드 기록 (0 = 첫 초안 평가, 1.. = 자가수정 후 평가) */
    public record Round(int round, int relevance, int completeness, int passedCount, int totalCount, String note) {}

    public record AgentResult(String summary, List<QuestionResult> questions, JobAnalysis analysis,
                              List<Source> sources, List<Round> rounds,
                              boolean passed, boolean starComplete, boolean grounded, boolean stoppedEarly,
                              int relevance, int completeness, int verifiedClaims, int totalClaims) {}
}