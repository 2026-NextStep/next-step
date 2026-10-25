package com.nextstep.backend.contract.dto.fastapi;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class FastApiAnalyzeResponse {

    private boolean success;

    @JsonProperty("ocr_text")
    private String ocrText;

    private String summary;

    @JsonProperty("risk_level")
    private String riskLevel;

    @JsonProperty("risk_score")
    private Integer riskScore;

    @JsonProperty("key_clauses")
    private List<FastApiKeyClause> keyClauses;

    private List<FastApiRisk> risks;

    private List<String> recommendations;

    @JsonProperty("basic_info")
    private FastApiBasicInfo basicInfo;

    @JsonProperty("salary_breakdown")
    private FastApiSalaryBreakdown salaryBreakdown;

    private List<FastApiPrecaution> precautions;

    @JsonProperty("questions_for_recruiter")
    private List<String> questionsForRecruiter;
}