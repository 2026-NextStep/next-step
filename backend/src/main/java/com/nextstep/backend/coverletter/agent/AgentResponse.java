package com.nextstep.backend.coverletter.agent;

import com.nextstep.backend.coverletter.agent.AgentModels.*;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 에이전트 결과를 화면으로 내려줄 JSON 모양(Map)으로 바꾼다.
 *   revisions : 문항별 수정본 (기존 화면과 같은 모양 — 수정된 내용에 자동으로 채워진다)
 *   report    : 검증 리포트 (점수, 기준 통과, 키워드, 라운드 기록, 보완 필요)
 *   questions : 문항별 평가와 근거 목록 (수정본의 사실 ← 원문 구절)
 *   sources   : 출처 목록
 */
public final class AgentResponse {

    private AgentResponse() {}

    public static Map<String, Object> from(AgentResult result, AgentInput input) {
        Map<String, QuestionResult> byNumber = new LinkedHashMap<>();
        for (QuestionResult q : result.questions()) byNumber.put(String.valueOf(q.number()), q);

        // 문항별 수정본 (답변이 비어 있던 문항도 자리를 맞춰 돌려준다)
        List<Map<String, Object>> revisions = new ArrayList<>();
        for (Question q : input.questions()) {
            QuestionResult r = byNumber.get(String.valueOf(q.number()));
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("questionNumber", q.number());
            row.put("revised", r == null ? "" : r.revised());
            row.put("comment", r == null ? "작성된 내용이 없어 첨삭하지 않았습니다."
                    : (r.changeNote().isEmpty() ? "" : r.changeNote()));
            revisions.add(row);
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("summary", result.summary());
        response.put("revisions", revisions);
        response.put("report", report(result));
        response.put("questions", questions(result));
        response.put("sources", sources(result));
        return response;
    }

    private static Map<String, Object> report(AgentResult result) {
        Map<String, Object> report = new LinkedHashMap<>();
        report.put("passed", result.passed());
        report.put("starComplete", result.starComplete());
        report.put("grounded", result.grounded());
        report.put("stoppedEarly", result.stoppedEarly());
        report.put("jobRelevance", result.relevance());
        report.put("completeness", result.completeness());
        report.put("minRelevance", RubricPolicy.MIN_RELEVANCE);
        report.put("minCompleteness", RubricPolicy.MIN_COMPLETENESS);
        report.put("verifiedClaims", result.verifiedClaims());
        report.put("totalClaims", result.totalClaims());
        report.put("evidence", evidenceSummary(result));

        Map<String, Object> keywords = new LinkedHashMap<>();
        keywords.put("core", keywordList(result.analysis().core()));
        keywords.put("preferred", keywordList(result.analysis().preferred()));
        keywords.put("note", result.analysis().note());
        report.put("keywords", keywords);

        List<Map<String, Object>> rounds = new ArrayList<>();
        for (Round r : result.rounds()) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("round", r.round());
            m.put("jobRelevance", r.relevance());
            m.put("completeness", r.completeness());
            m.put("passedCount", r.passedCount());
            m.put("totalCount", r.totalCount());
            m.put("note", r.note());
            rounds.add(m);
        }
        report.put("rounds", rounds);
        report.put("improvements", improvements(result));
        return report;
    }

    /** 검증 근거 요약: 서버가 직접 확인한 사실만 문장으로 만든다 */
    private static String evidenceSummary(AgentResult result) {
        StringBuilder sb = new StringBuilder();
        if (result.totalClaims() == 0) {
            sb.append("수정본이 근거로 제시한 사실이 없어 원문 대조를 하지 못했습니다.");
        } else {
            sb.append("수정본이 내세운 사실 ").append(result.totalClaims()).append("건 중 ")
                    .append(result.verifiedClaims()).append("건의 근거 구절을 원문에서 직접 확인했습니다.");
        }

        int verifiedKeywords = 0, keywordCount = 0;
        for (Keyword k : result.analysis().core()) {
            keywordCount++;
            if (k.verified()) verifiedKeywords++;
        }
        if (keywordCount > 0) {
            sb.append(result.grounded()
                    ? " 핵심 역량 키워드 " + keywordCount + "개 중 " + verifiedKeywords + "개는 연결된 자료에서 근거를 확인했습니다."
                    : " 핵심 역량 키워드는 직무 이름으로 추정한 값입니다.");
        }
        return sb.toString();
    }

    private static List<Map<String, Object>> keywordList(List<Keyword> keywords) {
        List<Map<String, Object>> out = new ArrayList<>();
        for (Keyword k : keywords) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("text", k.text());
            m.put("sourceId", k.sourceId());
            m.put("quote", k.quote());
            m.put("verified", k.verified());
            out.add(m);
        }
        return out;
    }

    /** 사용자가 직접 확인하거나 보충해야 할 것 */
    private static List<Map<String, Object>> improvements(AgentResult result) {
        List<Map<String, Object>> out = new ArrayList<>();
        for (QuestionResult q : result.questions()) {
            for (VerifiedClaim c : q.claims()) {
                if (!c.verified()) {
                    add(out, q.number(), "근거 미확인: \"" + c.text() + "\" — 원문에서 확인되지 않았으니 직접 확인해 주세요.");
                }
            }
            for (Issue issue : q.issues()) {
                if (!issue.fixable() || !q.passed()) {
                    add(out, q.number(), issue.detail());
                }
            }
            for (String need : q.needFromUser()) {
                add(out, q.number(), "직접 보충하면 좋아요: " + need);
            }
            if (!q.star().all()) {
                add(out, q.number(), "STAR 중 " + String.join(", ", q.star().missing()) + " 요소가 수정본에 분명히 드러나지 않습니다.");
            }
        }
        return out;
    }

    private static void add(List<Map<String, Object>> out, int number, String text) {
        for (Map<String, Object> existing : out) {
            if (existing.get("questionNumber").equals(number) && existing.get("text").equals(text)) return; // 중복 제거
        }
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("questionNumber", number);
        m.put("text", text);
        out.add(m);
    }

    private static List<Map<String, Object>> questions(AgentResult result) {
        List<Map<String, Object>> out = new ArrayList<>();
        for (QuestionResult q : result.questions()) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("questionNumber", q.number());
            m.put("jobRelevance", q.relevance());
            m.put("completeness", q.completeness());
            m.put("passed", q.passed());
            m.put("rewrites", q.rewrites());

            Map<String, Object> star = new LinkedHashMap<>();
            star.put("situation", q.star().situation());
            star.put("task", q.star().task());
            star.put("action", q.star().action());
            star.put("result", q.star().result());
            m.put("star", star);

            List<Map<String, Object>> claims = new ArrayList<>();
            for (VerifiedClaim c : q.claims()) {
                Map<String, Object> cm = new LinkedHashMap<>();
                cm.put("text", c.text());
                cm.put("sourceId", c.sourceId());
                cm.put("quote", c.quote());
                cm.put("verified", c.verified());
                claims.add(cm);
            }
            m.put("claims", claims);
            out.add(m);
        }
        return out;
    }

    private static List<Map<String, Object>> sources(AgentResult result) {
        List<Map<String, Object>> out = new ArrayList<>();
        for (Source s : result.sources()) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", s.id());
            m.put("type", s.type());
            m.put("title", s.title());
            m.put("detail", s.detail());
            m.put("url", s.url());
            out.add(m);
        }
        return out;
    }
}