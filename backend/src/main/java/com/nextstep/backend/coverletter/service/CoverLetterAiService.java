package com.nextstep.backend.coverletter.service;

import com.nextstep.backend.coverletter.agent.AgentModels;
import com.nextstep.backend.coverletter.agent.AgentModels.AgentInput;
import com.nextstep.backend.coverletter.agent.AgentModels.Question;
import com.nextstep.backend.coverletter.agent.AgentModels.SourceText;
import com.nextstep.backend.coverletter.agent.AgentResponse;
import com.nextstep.backend.coverletter.agent.AgentText;
import com.nextstep.backend.coverletter.agent.CoverLetterAgent;
import com.nextstep.backend.coverletter.dto.CoverLetterReviseRequest;
import com.nextstep.backend.coverletter.dto.QuestionAnswerDto;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

/**
 * 자소서 AI 첨삭 진입점: 요청을 검사하고, 출처가 될 자료(채용공고, 올린 문서)를 모아 AI Agent 를 실행한다.
 * 실제 4단계 처리는 CoverLetterAgent, Gemini 호출은 GeminiClient 가 맡는다.
 */
@Service
public class CoverLetterAiService {

    private static final int MAX_QUESTIONS       = 20;
    private static final int MAX_TOTAL_CHARS     = 20000;  // 문항 답변 전체 글자 수 제한
    private static final int MAX_REFERENCE_CHARS = 8000;   // 올린 문서 텍스트는 이 길이까지만 사용

    private final CoverLetterAgent agent;
    private final JobPostingLookup jobPostingLookup;

    public CoverLetterAiService(CoverLetterAgent agent, JobPostingLookup jobPostingLookup) {
        this.agent = agent;
        this.jobPostingLookup = jobPostingLookup;
    }

    public Map<String, Object> revise(CoverLetterReviseRequest request) {
        validate(request);
        AgentInput input = buildInput(request);
        return AgentResponse.from(agent.run(input), input);
    }

    // ── 입력 검사 ─────────────────────────────────────

    private void validate(CoverLetterReviseRequest request) {
        if (request == null || request.getQuestions() == null || request.getQuestions().isEmpty()) {
            throw new IllegalArgumentException("첨삭할 문항이 없습니다.");
        }
        if (request.getQuestions().size() > MAX_QUESTIONS) {
            throw new IllegalArgumentException("한 번에 첨삭할 수 있는 문항 수를 초과했습니다.");
        }

        int total = 0;
        for (QuestionAnswerDto q : request.getQuestions()) {
            if (q.getAnswer() != null) total += q.getAnswer().length();
        }
        if (total > MAX_TOTAL_CHARS) {
            throw new IllegalArgumentException("첨삭할 내용이 너무 깁니다. (최대 " + MAX_TOTAL_CHARS + "자)");
        }
    }

    // ── 에이전트 입력 만들기 ──────────────────────────

    private AgentInput buildInput(CoverLetterReviseRequest request) {
        List<Question> questions = request.getQuestions().stream()
                .sorted(Comparator.comparingInt(QuestionAnswerDto::getQuestionNumber))
                .map(q -> new Question(q.getQuestionNumber(),
                        AgentText.nullToEmpty(q.getQuestion()),
                        AgentText.nullToEmpty(q.getAnswer())))
                .toList();

        // 출처가 될 자료: ① 연결된 채용공고 ② 사용자가 올린 문서
        List<SourceText> sources = new ArrayList<>();
        jobPostingLookup.find(request.getJobPostingId(), request.getCompany(), request.getPosition())
                .ifPresent(sources::add);

        String reference = AgentText.nullToEmpty(request.getReference()).trim();
        if (!reference.isEmpty()) {
            boolean resume = "RESUME".equalsIgnoreCase(request.getReferenceType());
            String name = AgentText.nullToEmpty(request.getReferenceName()).trim();
            if (name.isEmpty()) name = resume ? "내 이력서" : "참고 문서";

            sources.add(new SourceText(
                    "R1",
                    resume ? AgentModels.SRC_REFERENCE_RESUME : AgentModels.SRC_REFERENCE_JD,
                    name,
                    resume ? "업로드한 이력서/포트폴리오 (지원자 경험의 근거로 사용)"
                            : "업로드한 채용공고(JD) 문서 (직무 기준으로 사용)",
                    null,
                    AgentText.truncate(reference, MAX_REFERENCE_CHARS)));
        }

        return new AgentInput(questions,
                AgentText.nullToEmpty(request.getRequest()).trim(),
                AgentText.nullToEmpty(request.getCompany()).trim(),
                AgentText.nullToEmpty(request.getPosition()).trim(),
                sources);
    }
}