package com.nextstep.backend.contract.mapper;

import com.nextstep.backend.contract.dto.ContractAnalysisResponse;
import com.nextstep.backend.contract.dto.fastapi.FastApiAnalyzeResponse;
import com.nextstep.backend.contract.dto.fastapi.FastApiBasicInfo;
import com.nextstep.backend.contract.dto.fastapi.FastApiPrecaution;
import com.nextstep.backend.contract.dto.fastapi.FastApiRisk;
import com.nextstep.backend.contract.dto.fastapi.FastApiSalaryBreakdown;
import com.nextstep.backend.contract.entity.ContractDocument;
import com.nextstep.backend.contract.util.SalaryCalculator;
import org.springframework.stereotype.Component;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Component
public class ContractAnalysisMapper {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy.MM.dd");

    public ContractAnalysisResponse toAnalysisResponse(FastApiAnalyzeResponse fastApi, ContractDocument contract) {
        List<ContractAnalysisResponse.RiskItem> riskItems = mapRisks(fastApi.getRisks());
        List<ContractAnalysisResponse.Precaution> precautions = mapPrecautions(fastApi.getPrecautions());

        int highCount   = (int) riskItems.stream().filter(r -> "HIGH".equals(r.getLevel())).count();
        int mediumCount = (int) riskItems.stream().filter(r -> "MEDIUM".equals(r.getLevel())).count();
        int checkItemCount = riskItems.size() + precautions.size();

        String uploadedAt = contract.getUploadedAt() != null
                ? contract.getUploadedAt().format(DATE_FORMATTER)
                : "";

        return ContractAnalysisResponse.builder()
                .id(contract.getContractId())
                .fileName(contract.getFileName())
                .uploadedAt(uploadedAt)
                .totalPages(0)
                .contractSummary(fastApi.getSummary())
                .contractSummaryNote(null)
                .overallRiskLevel(fastApi.getRiskLevel())
                .riskItemCount(riskItems.size())
                .highRiskCount(highCount)
                .mediumRiskCount(mediumCount)
                .checkItemCount(checkItemCount)
                .checkItemNote(null)
                .riskItems(riskItems)
                .basicInfo(mapBasicInfo(fastApi.getBasicInfo(), fastApi.getSalaryBreakdown()))
                .salaryBreakdown(mapSalaryBreakdown(fastApi.getSalaryBreakdown()))
                .precautions(precautions)
                .questionsForRecruiter(
                        fastApi.getQuestionsForRecruiter() != null
                                ? fastApi.getQuestionsForRecruiter()
                                : Collections.emptyList()
                )
                .build();
    }

    // ─── RiskItem 매핑 ──────────────────────────────────────────────────────

    private List<ContractAnalysisResponse.RiskItem> mapRisks(List<FastApiRisk> risks) {
        if (risks == null) return Collections.emptyList();

        List<ContractAnalysisResponse.RiskItem> result = new ArrayList<>();
        for (int i = 0; i < risks.size(); i++) {
            FastApiRisk r = risks.get(i);
            result.add(ContractAnalysisResponse.RiskItem.builder()
                    .id((long) (i + 1))
                    .title(r.getType())
                    .level(r.getSeverity())
                    .description(r.getDescription())
                    .reason(buildReason(r))
                    .recommendation(r.getRecommendation())
                    .build());
        }
        return result;
    }

    private String buildReason(FastApiRisk r) {
        if (r.getReason() != null && r.getClauseReference() != null) {
            return r.getReason() + " (관련 조항: " + r.getClauseReference() + ")";
        }
        if (r.getReason() != null) return r.getReason();
        if (r.getClauseReference() != null) return "관련 조항: " + r.getClauseReference();
        return null;
    }

    // ─── BasicInfo 매핑 ─────────────────────────────────────────────────────

    private ContractAnalysisResponse.BasicInfo mapBasicInfo(
            FastApiBasicInfo src, FastApiSalaryBreakdown salary) {
        if (src == null) return null;

        String salaryStr = null;
        if (salary != null && salary.getGrossSalary() != null) {
            salaryStr = "월 " + (salary.getGrossSalary() / 10000) + "만원";
        }

        return ContractAnalysisResponse.BasicInfo.builder()
                .companyName(src.getCompanyName())
                .employerName(src.getEmployerName())
                .position(src.getJobDescription())
                .contractPeriod(src.getWorkPeriod())
                .workingHours(src.getWorkHours())
                .probationPeriod(src.getProbationPeriod())
                .salary(salaryStr)
                .workLocation(src.getWorkLocation())
                .employmentType(src.getEmploymentType())
                .build();
    }

    // ─── SalaryBreakdown 매핑 ───────────────────────────────────────────────

    private ContractAnalysisResponse.SalaryBreakdown mapSalaryBreakdown(FastApiSalaryBreakdown src) {
        if (src == null) return null;

        SalaryCalculator.Result calc = SalaryCalculator.calculate(toLong(src.getGrossSalary()));

        return ContractAnalysisResponse.SalaryBreakdown.builder()
                .grossSalary(calc.grossSalary)
                .nationalPension(calc.nationalPension)
                .healthInsurance(calc.healthInsurance)
                .longTermCareInsurance(calc.longTermCareInsurance)
                .employmentInsurance(calc.employmentInsurance)
                .incomeTax(calc.incomeTax)
                .localIncomeTax(calc.localIncomeTax)
                .netSalary(calc.netSalary)
                .note(src.getNote())
                .build();
    }

    // ─── Precaution 매핑 ────────────────────────────────────────────────────

    private List<ContractAnalysisResponse.Precaution> mapPrecautions(List<FastApiPrecaution> src) {
        if (src == null) return Collections.emptyList();

        List<ContractAnalysisResponse.Precaution> result = new ArrayList<>();
        for (FastApiPrecaution p : src) {
            result.add(ContractAnalysisResponse.Precaution.builder()
                    .title(p.getTitle())
                    .description(p.getDescription())
                    .build());
        }
        return result;
    }

    // ─── 유틸 ───────────────────────────────────────────────────────────────

    private Long toLong(Integer value) {
        return value != null ? value.longValue() : null;
    }
}