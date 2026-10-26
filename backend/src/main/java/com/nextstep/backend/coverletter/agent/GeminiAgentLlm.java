package com.nextstep.backend.coverletter.agent;

import com.nextstep.backend.coverletter.agent.AgentModels.*;
import com.nextstep.backend.coverletter.agent.AgentPrompts.Prompt;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/** AgentLlm 구현: 프롬프트를 만들어 모델을 부르고, 돌아온 JSON 을 데이터 모양으로 옮긴다. */
@Component
public class GeminiAgentLlm implements AgentLlm {

    private static final double TEMP_ANALYZE  = 0.2;
    private static final double TEMP_GENERATE = 0.5;
    private static final double TEMP_EVALUATE = 0.2;

    private static final int MAX_KEYWORDS = 3;

    private final ModelCaller model;

    public GeminiAgentLlm(ModelCaller model) {
        this.model = model;
    }

    // ── 1단계 ──
    @Override
    public JobAnalysis analyze(AgentInput input) {
        Prompt p = AgentPrompts.analyze(input);
        Object tree = model.callJson(p.system(), p.user(), TEMP_ANALYZE);

        return new JobAnalysis(
                readKeywords(JsonTree.obj(tree).get("core")),
                readKeywords(JsonTree.obj(tree).get("preferred")),
                JsonTree.str(tree, "note")
        );
    }

    private List<Keyword> readKeywords(Object node) {
        List<Keyword> out = new ArrayList<>();
        for (Object item : JsonTree.list(node)) {
            String text = JsonTree.str(item, "text");
            if (text.isEmpty() || out.size() >= MAX_KEYWORDS) continue;
            // verified/sourceId 는 서버가 자료와 대조한 뒤에 정한다. 여기서는 AI 가 말한 값만 담는다.
            out.add(new Keyword(text, JsonTree.str(item, "source"), JsonTree.str(item, "quote"), false));
        }
        return out;
    }

    // ── 2단계 (+ 4단계 재작성) ──
    @Override
    public List<Draft> generate(AgentInput input, JobAnalysis analysis, List<Question> targets,
                                Map<Integer, Rewrite> rewrites) {
        Prompt p = AgentPrompts.generate(input, analysis, targets, rewrites);
        Object tree = model.callJson(p.system(), p.user(), TEMP_GENERATE);

        List<Draft> out = new ArrayList<>();
        for (Object item : JsonTree.list(JsonTree.obj(tree).get("drafts"))) {
            int number = JsonTree.intVal(item, "questionNumber", -1);
            if (number < 0) continue;

            List<Claim> claims = new ArrayList<>();
            for (Object c : JsonTree.list(JsonTree.obj(item).get("claims"))) {
                String text = JsonTree.str(c, "text");
                if (!text.isEmpty()) claims.add(new Claim(text, JsonTree.str(c, "quote")));
            }
            out.add(new Draft(number,
                    JsonTree.str(item, "revised"),
                    JsonTree.str(item, "changeNote"),
                    claims,
                    JsonTree.strings(item, "needFromUser")));
        }
        return out;
    }

    // ── 3단계 ──
    @Override
    public List<Evaluation> evaluate(AgentInput input, JobAnalysis analysis, List<Draft> drafts,
                                     Map<Integer, List<VerifiedClaim>> verifiedClaims) {
        Prompt p = AgentPrompts.evaluate(input, analysis, drafts, verifiedClaims);
        Object tree = model.callJson(p.system(), p.user(), TEMP_EVALUATE);

        List<Evaluation> out = new ArrayList<>();
        for (Object item : JsonTree.list(JsonTree.obj(tree).get("evaluations"))) {
            int number = JsonTree.intVal(item, "questionNumber", -1);
            if (number < 0) continue;

            Object star = JsonTree.obj(item).get("star");
            Star s = new Star(
                    JsonTree.bool(star, "situation", false),
                    JsonTree.bool(star, "task", false),
                    JsonTree.bool(star, "action", false),
                    JsonTree.bool(star, "result", false));

            List<Issue> issues = new ArrayList<>();
            for (Object i : JsonTree.list(JsonTree.obj(item).get("issues"))) {
                String detail = JsonTree.str(i, "detail");
                if (detail.isEmpty()) continue;
                String type = JsonTree.str(i, "type").toUpperCase();
                if (type.isEmpty()) type = RubricPolicy.TYPE_STYLE;
                issues.add(new Issue(type, detail, JsonTree.bool(i, "fixable", false)));
            }

            out.add(new Evaluation(number,
                    RubricPolicy.clampScore(JsonTree.intVal(item, "relevance", 0)),
                    RubricPolicy.clampScore(JsonTree.intVal(item, "completeness", 0)),
                    s, issues, JsonTree.str(item, "comment")));
        }
        return out;
    }
}