package com.nextstep.backend.coverletter.agent;

import com.nextstep.backend.coverletter.agent.AgentModels.*;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeSet;
import java.util.function.LongSupplier;

/**
 * 자소서 첨삭 AI Agent. 4단계로 움직인다.
 *   1. Job Analyzer     공고/문서에서 필수 역량 키워드 추출
 *   2. STAR Generator   상황-과제-행동-결과 구조로 수정본 작성 (사실마다 근거 구절 제시)
 *   3. Interviewer      서버가 근거를 원문과 대조(Fact Check) + 면접관 평가(점수, STAR, 문제점)
 *   4. Self-Correction  기준 미달 문항만 지적 사항을 반영해 다시 쓰고 재평가 (최대 2회, 더 나은 쪽을 채택)
 *
 * 통과/미달 판단과 근거 확인은 AI 가 아니라 서버(RubricPolicy, EvidenceVerifier)가 한다.
 */
@Service
public class CoverLetterAgent {

    static final long DEFAULT_BUDGET_MS    = 150_000; // 에이전트 전체 제한 시간
    static final long MIN_ROUND_BUDGET_MS  = 45_000;  // 자가수정 한 바퀴(재작성+재평가)를 시작하려면 남아 있어야 하는 시간

    private final AgentLlm llm;
    private LongSupplier clock = System::currentTimeMillis;
    private long budgetMs = DEFAULT_BUDGET_MS;

    public CoverLetterAgent(AgentLlm llm) {
        this.llm = llm;
    }

    /** 시간 흐름을 조작해 테스트하기 위한 설정 (운영 코드에서는 쓰지 않는다) */
    void configureForTest(LongSupplier clock, long budgetMs) {
        this.clock = clock;
        this.budgetMs = budgetMs;
    }

    /** 한 문항의 현재 최선 결과 */
    private record Candidate(Draft draft, List<VerifiedClaim> claims, Evaluation eval, int rewrites) {
        int unverified() {
            int n = 0;
            for (VerifiedClaim c : claims) {
                if (!c.verified()) n++;
            }
            return n;
        }

        boolean blank() {
            return draft.revised() == null || draft.revised().isBlank();
        }

        boolean needsRewrite() {
            return blank() || RubricPolicy.needsRewrite(eval, unverified());
        }
    }

    // ═══════════════════════════ 실행 ═══════════════════════════

    public AgentResult run(AgentInput input) {
        long start = clock.getAsLong();

        List<Question> targets = new ArrayList<>();
        for (Question q : input.questions()) {
            if (q.hasAnswer()) targets.add(q);
        }
        if (targets.isEmpty()) {
            throw new IllegalArgumentException("첨삭할 답변이 없습니다.");
        }

        // 1단계: 공고 분석 (+ 키워드 근거를 자료와 대조)
        JobAnalysis analysis = verifyKeywords(llm.analyze(input), input);

        // 2단계: STAR 초안
        List<Draft> drafts = llm.generate(input, analysis, targets, Map.of());

        // 3단계: 근거 대조 + 면접관 평가
        Map<Integer, Candidate> current = evaluateAll(input, analysis, targets, drafts);
        List<Round> rounds = new ArrayList<>();
        rounds.add(snapshot(0, current, "STAR 초안 작성 → 면접관 평가"));

        // 4단계: 자가수정
        boolean stoppedEarly = false;
        for (int round = 1; round <= RubricPolicy.MAX_REWRITE_ROUNDS; round++) {
            List<Question> failing = new ArrayList<>();
            for (Question q : targets) {
                if (current.get(q.number()).needsRewrite()) failing.add(q);
            }
            if (failing.isEmpty()) break;

            long remaining = budgetMs - (clock.getAsLong() - start);
            if (remaining < MIN_ROUND_BUDGET_MS) {
                stoppedEarly = true;
                break;
            }

            try {
                Map<Integer, Rewrite> rewrites = new LinkedHashMap<>();
                for (Question q : failing) {
                    Candidate c = current.get(q.number());
                    rewrites.put(q.number(), new Rewrite(c.draft().revised(), feedbackFor(c)));
                }

                List<Draft> redrafts = llm.generate(input, analysis, failing, rewrites);
                Map<Integer, Candidate> reevaluated = evaluateAll(input, analysis, failing, redrafts);

                int improved = 0;
                for (Question q : failing) {
                    Candidate old = current.get(q.number());
                    Candidate fresh = reevaluated.get(q.number());
                    Candidate kept = pickBetter(old, fresh);
                    if (kept == fresh) improved++;
                    current.put(q.number(), new Candidate(kept.draft(), kept.claims(), kept.eval(), old.rewrites() + 1));
                }
                rounds.add(snapshot(round, current,
                        "기준 미달 " + failing.size() + "개 문항 자가수정 → 재평가 (개선 " + improved + "개)"));
            } catch (RuntimeException e) {
                // 자가수정 중 AI 오류: 지금까지의 최선 결과는 그대로 돌려준다
                stoppedEarly = true;
                break;
            }
        }

        return assemble(input, analysis, targets, current, rounds, stoppedEarly);
    }

    // ═══════════════════════════ 근거 확인 ═══════════════════════════

    /** 1단계 키워드의 인용 구절이 실제 자료에 있는지 확인한다. 없으면 AI 추정으로 표시한다. */
    JobAnalysis verifyKeywords(JobAnalysis raw, AgentInput input) {
        return new JobAnalysis(
                verifyKeywordList(raw.core(), input),
                verifyKeywordList(raw.preferred(), input),
                raw.note());
    }

    private List<Keyword> verifyKeywordList(List<Keyword> keywords, AgentInput input) {
        List<Keyword> out = new ArrayList<>();
        for (Keyword k : keywords) {
            String foundIn = null;
            for (SourceText s : input.sourceTexts()) {
                if (EvidenceVerifier.appearsIn(k.quote(), s.text())) {
                    foundIn = s.id();
                    break;
                }
            }
            out.add(foundIn != null
                    ? new Keyword(k.text(), foundIn, k.quote(), true)
                    : new Keyword(k.text(), null, "", false));
        }
        return out;
    }

    /**
     * 수정본이 내세운 사실의 근거 구절을 "지원자가 실제로 쓴 글"에서 찾아본다.
     * 찾아볼 곳: 지원자 원문(모든 문항), 이력서로 올린 문서. 채용공고는 지원자의 경험이 아니므로 근거가 될 수 없다.
     */
    List<VerifiedClaim> verifyClaims(int questionNumber, List<Claim> claims, AgentInput input) {
        List<VerifiedClaim> out = new ArrayList<>();
        for (Claim claim : claims) {
            String foundIn = null;

            for (Question q : input.questions()) {
                if (q.hasAnswer() && EvidenceVerifier.appearsIn(claim.quote(), q.answer())) {
                    foundIn = "O" + q.number();
                    break;
                }
            }
            if (foundIn == null) {
                for (SourceText s : input.sourceTexts()) {
                    if (s.isFactSource() && EvidenceVerifier.appearsIn(claim.quote(), s.text())) {
                        foundIn = s.id();
                        break;
                    }
                }
            }
            out.add(new VerifiedClaim(questionNumber, claim.text(), foundIn, claim.quote(), foundIn != null));
        }
        return out;
    }

    // ═══════════════════════════ 평가 ═══════════════════════════

    /** targets 에 대한 수정본을 근거 대조한 뒤 면접관에게 평가시키고, 문항별 후보로 묶는다. */
    private Map<Integer, Candidate> evaluateAll(AgentInput input, JobAnalysis analysis,
                                                List<Question> targets, List<Draft> drafts) {
        Map<Integer, Draft> draftBy = new HashMap<>();
        for (Draft d : drafts) draftBy.put(d.number(), d);

        List<Draft> ordered = new ArrayList<>();
        Map<Integer, List<VerifiedClaim>> verified = new HashMap<>();
        for (Question q : targets) {
            Draft d = draftBy.getOrDefault(q.number(), new Draft(q.number(), "", "", List.of(), List.of()));
            ordered.add(d);
            verified.put(q.number(), verifyClaims(q.number(), d.claims(), input));
        }

        List<Evaluation> evals = llm.evaluate(input, analysis, ordered, verified);
        Map<Integer, Evaluation> evalBy = new HashMap<>();
        for (Evaluation e : evals) evalBy.put(e.number(), e);

        Map<Integer, Candidate> out = new LinkedHashMap<>();
        for (Draft d : ordered) {
            Evaluation e = evalBy.getOrDefault(d.number(), missingEvaluation(d.number()));
            out.put(d.number(), new Candidate(d, verified.get(d.number()), e, 0));
        }
        return out;
    }

    private Evaluation missingEvaluation(int number) {
        return new Evaluation(number, 0, 0, new Star(false, false, false, false),
                List.of(new Issue(RubricPolicy.TYPE_STRUCTURE, "면접관 평가를 받지 못했습니다.", true)),
                "평가 결과 없음");
    }

    /** 고쳐 쓴 결과가 비어 있거나 더 나쁘면 이전 결과를 유지한다. 같으면 이전 결과를 유지한다. */
    private Candidate pickBetter(Candidate old, Candidate fresh) {
        if (fresh == null || fresh.blank()) return old;
        if (old.blank()) return fresh;
        int oldScore   = RubricPolicy.qualityScore(old.eval(), old.unverified());
        int freshScore = RubricPolicy.qualityScore(fresh.eval(), fresh.unverified());
        return freshScore > oldScore ? fresh : old;
    }

    /** 자가수정 때 AI 에게 넘길 지적 사항 */
    private String feedbackFor(Candidate c) {
        List<String> lines = new ArrayList<>();
        if (c.blank()) {
            lines.add("- 수정본이 비어 있습니다. 반드시 작성하세요.");
        }
        for (VerifiedClaim claim : c.claims()) {
            if (!claim.verified()) {
                lines.add("- 원문에서 근거를 확인할 수 없는 주장: \"" + claim.text() + "\" (인용: \"" + claim.quote()
                        + "\"). 원문에 없는 내용은 빼고, 원문에 있는 구절로만 근거를 대세요.");
            }
        }
        Evaluation e = c.eval();
        if (e.relevance() < RubricPolicy.MIN_RELEVANCE) {
            lines.add("- 직무 연관성 " + e.relevance() + "점 (기준 " + RubricPolicy.MIN_RELEVANCE
                    + "점). 핵심 역량 키워드와 원문 경험의 연결을 더 분명히 하세요. 단, 원문에 없는 경험을 만들면 안 됩니다.");
        }
        if (e.completeness() < RubricPolicy.MIN_COMPLETENESS) {
            lines.add("- 문맥/완성도 " + e.completeness() + "점 (기준 " + RubricPolicy.MIN_COMPLETENESS
                    + "점). 질문 의도에 맞게 상황-과제-행동-결과 흐름을 정리하세요.");
        }
        for (Issue issue : e.issues()) {
            if (issue.fixable()) {
                lines.add("- [" + issue.type() + "] " + issue.detail());
            }
        }
        return String.join("\n", lines);
    }

    // ═══════════════════════════ 결과 조립 ═══════════════════════════

    private Round snapshot(int round, Map<Integer, Candidate> current, String note) {
        int relevance = 0, completeness = 0, passed = 0;
        for (Candidate c : current.values()) {
            relevance    += c.eval().relevance();
            completeness += c.eval().completeness();
            if (!c.needsRewrite()) passed++;
        }
        int n = Math.max(1, current.size());
        return new Round(round, Math.round((float) relevance / n), Math.round((float) completeness / n),
                passed, current.size(), note);
    }

    private AgentResult assemble(AgentInput input, JobAnalysis analysis, List<Question> targets,
                                 Map<Integer, Candidate> current, List<Round> rounds, boolean stoppedEarly) {
        List<QuestionResult> results = new ArrayList<>();
        boolean allPassed = true, starComplete = true;
        int relevance = 0, completeness = 0, verifiedCount = 0, totalCount = 0, rewriteRounds = 0;
        TreeSet<Integer> usedOriginals = new TreeSet<>();

        for (Question q : targets) {
            Candidate c = current.get(q.number());
            boolean passed = !c.needsRewrite();
            allPassed &= passed;
            starComplete &= c.eval().star().all();
            relevance += c.eval().relevance();
            completeness += c.eval().completeness();
            rewriteRounds = Math.max(rewriteRounds, c.rewrites());

            for (VerifiedClaim claim : c.claims()) {
                totalCount++;
                if (claim.verified()) {
                    verifiedCount++;
                    if (claim.sourceId() != null && claim.sourceId().startsWith("O")) {
                        usedOriginals.add(Integer.parseInt(claim.sourceId().substring(1)));
                    }
                }
            }

            results.add(new QuestionResult(q.number(), AgentText.nullToEmpty(c.draft().revised()).trim(),
                    AgentText.nullToEmpty(c.draft().changeNote()).trim(),
                    c.eval().relevance(), c.eval().completeness(), c.eval().star(),
                    c.eval().issues(), c.claims(), c.draft().needFromUser(), passed, c.rewrites()));
        }

        int n = Math.max(1, targets.size());
        int avgRelevance = Math.round((float) relevance / n);
        int avgCompleteness = Math.round((float) completeness / n);

        // 출처 목록: 연결된 공고/문서 + 근거로 쓰인 지원자 원문 + 평가 기준
        List<Source> sources = new ArrayList<>();
        for (SourceText s : input.sourceTexts()) {
            sources.add(new Source(s.id(), s.type(), s.title(), s.detail(), s.url()));
        }
        for (int number : usedOriginals) {
            String title = "지원자 원문 · 문항 " + number;
            String detail = "";
            for (Question q : input.questions()) {
                if (q.number() == number) detail = AgentText.truncate(AgentText.nullToEmpty(q.question()).trim(), 60);
            }
            sources.add(new Source("O" + number, AgentModels.SRC_ORIGINAL, title, detail, null));
        }
        sources.add(new Source("RUBRIC", AgentModels.SRC_RUBRIC, "STAR 평가 기준", RubricPolicy.describe(), null));

        boolean grounded = !input.sourceTexts().isEmpty();
        String summary = buildSummary(targets.size(), rewriteRounds, allPassed, stoppedEarly, grounded);

        return new AgentResult(summary, results, analysis, sources, rounds,
                allPassed, starComplete, grounded, stoppedEarly,
                avgRelevance, avgCompleteness, verifiedCount, totalCount);
    }

    private String buildSummary(int questionCount, int rewriteRounds, boolean allPassed,
                                boolean stoppedEarly, boolean grounded) {
        StringBuilder sb = new StringBuilder();
        sb.append("문항 ").append(questionCount).append("개를 STAR 구조로 첨삭했습니다. ");
        sb.append(rewriteRounds > 0
                ? "면접관 평가에서 기준에 못 미친 문항을 자가수정 " + rewriteRounds + "회 거쳤습니다. "
                : "첫 초안이 별도 수정 없이 평가를 통과했습니다. ");
        sb.append(allPassed
                ? "최종 결과가 모든 평가 기준을 충족했습니다."
                : "일부 문항은 '보완 필요' 항목을 직접 채워야 기준을 충족할 수 있습니다.");
        if (stoppedEarly) {
            sb.append(" (시간 제한 또는 AI 오류로 자가수정을 일찍 마쳤습니다.)");
        }
        if (!grounded) {
            sb.append(" 연결된 채용공고나 JD 문서가 없어서 직무 연관성은 직무 이름만 기준으로 한 참고용 점수입니다.");
        }
        return sb.toString();
    }
}