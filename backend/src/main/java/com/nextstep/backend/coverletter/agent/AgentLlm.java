package com.nextstep.backend.coverletter.agent;

import com.nextstep.backend.coverletter.agent.AgentModels.*;

import java.util.List;
import java.util.Map;

/**
 * 에이전트가 AI 에게 시키는 일 3가지. (구현은 Gemini 를 부르는 GeminiAgentLlm)
 * 순서와 반복(자가수정)은 CoverLetterAgent 가 정하고, 이 인터페이스는 "한 번 시키는 일"만 맡는다.
 */
public interface AgentLlm {

    /** 1단계 Job Analyzer: 공고/문서에서 필수 역량 키워드 3개와 우대사항을 뽑는다 */
    JobAnalysis analyze(AgentInput input);

    /**
     * 2단계 STAR Generator (그리고 4단계 자가수정의 재작성).
     * rewrites 가 비어 있으면 첫 작성, 있으면 해당 문항을 지적 사항을 반영해 다시 쓴다.
     */
    List<Draft> generate(AgentInput input, JobAnalysis analysis, List<Question> targets, Map<Integer, Rewrite> rewrites);

    /** 3단계 Interviewer: 수정본을 엄격하게 평가한다. verifiedClaims 는 서버가 이미 근거를 대조한 결과 */
    List<Evaluation> evaluate(AgentInput input, JobAnalysis analysis, List<Draft> drafts,
                              Map<Integer, List<VerifiedClaim>> verifiedClaims);
}