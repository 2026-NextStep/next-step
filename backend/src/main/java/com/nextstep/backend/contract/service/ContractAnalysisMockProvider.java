package com.nextstep.backend.contract.service;

import com.nextstep.backend.contract.dto.ContractAnalysisResponse;
import com.nextstep.backend.contract.entity.ContractDocument;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.time.format.DateTimeFormatter;
import java.util.List;

@Component
@ConditionalOnProperty(name = "ai.provider", havingValue = "mock")
public class ContractAnalysisMockProvider implements ContractAnalysisProvider {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy.MM.dd");

    @Override
    public ContractAnalysisResponse analyze(ContractDocument contract, byte[] fileBytes, String mimeType) {
        return buildMockAnalysis(contract);
    }

    private ContractAnalysisResponse buildMockAnalysis(ContractDocument contract) {

        String uploadedAtStr = contract.getUploadedAt() != null
                ? contract.getUploadedAt().format(DATE_FORMATTER)
                : "";

        List<ContractAnalysisResponse.RiskItem> riskItems = List.of(
            ContractAnalysisResponse.RiskItem.builder()
                .id(1L)
                .title("포괄임금제 관련 문구가 모호합니다")
                .level("HIGH")
                .description("계약서에 \"연장 · 야간 · 휴일근로 수당은 월 급여에 포함한다\"는 문구가 있으나, 포함 범위와 시간 산정 기준이 명확하지 않습니다.")
                .reason("근로시간과 수당 산정 기준이 빠진 포괄임금 약정은 무효 또는 분쟁 소지가 생길 수 있습니다.")
                .recommendation("")
                .build(),
            ContractAnalysisResponse.RiskItem.builder()
                .id(2L)
                .title("휴게시간 기재가 구체적이지 않습니다")
                .level("MEDIUM")
                .description("근무시간은 오전 9시부터 오후 6시로 적혀 있지만, 휴게시간이 \"회사 사정에 따른다\"고만 기재되어 있습니다.")
                .reason("")
                .recommendation("점심시간과 휴게시간의 시작 · 종료 시각을 명시해 달라고 요청하는 것이 좋습니다.")
                .build(),
            ContractAnalysisResponse.RiskItem.builder()
                .id(3L)
                .title("수습기간 중 급여 감액 기준이 불명확합니다")
                .level("MEDIUM")
                .description("수습 3개월 조항은 있으나, 수습기간 중 급여를 얼마까지 감액하는지와 감액 사유가 구체적으로 적혀 있지 않습니다.")
                .reason("")
                .recommendation("수습기간 적용 임금, 평가 방식, 정식 채용 전환 기준을 서면으로 요청해 두면 안전합니다.")
                .build()
        );

        ContractAnalysisResponse.SalaryBreakdown salaryBreakdown =
            ContractAnalysisResponse.SalaryBreakdown.builder()
                .grossSalary(2500000L)
                .nationalPension(-112500L)
                .healthInsurance(-88750L)
                .longTermCareInsurance(-11490L)
                .employmentInsurance(-22500L)
                .netSalary(2284530L)
                .build();

        ContractAnalysisResponse.BasicInfo basicInfo =
            ContractAnalysisResponse.BasicInfo.builder()
                .companyName("오렌지웨이브")
                .position("마케팅 인턴")
                .contractPeriod("2025.03.15 ~ 2026.03.14")
                .workingHours("주 40시간 · 09:00 ~ 18:00")
                .probationPeriod("3개월")
                .salary("월 250만원")
                .build();

        List<ContractAnalysisResponse.Precaution> precautions = List.of(
            ContractAnalysisResponse.Precaution.builder()
                .title("구두 설명만 믿지 말고 서면본을 받으세요")
                .description("담당자가 구두로 설명한 내용이 있다면 계약서에 직접 반영되었는지 확인하세요.")
                .build(),
            ContractAnalysisResponse.Precaution.builder()
                .title("포괄임금제, 수습, 휴게시간은 꼭 질문하세요")
                .description("가장 자주 분쟁이 발생하는 항목들입니다. 모호한 문구는 구체적으로 수정 요청하는 것이 좋습니다.")
                .build(),
            ContractAnalysisResponse.Precaution.builder()
                .title("사인 전 계약서 사본을 저장하세요")
                .description("PDF 원본과 분석 결과를 함께 저장해 두면 이후 문제 발생 시 도움이 됩니다.")
                .build()
        );

        List<String> questionsForRecruiter = List.of(
            "포괄임금에 포함되는 연장근로 시간이 월 몇 시간인지 명확히 안내해 주실 수 있나요?",
            "수습기간 중 급여와 정규 전환 기준은 어떻게 적용되나요?",
            "점심시간과 휴게시간은 실제로 몇 시부터 몇 시까지 보장되나요?",
            "주말 · 야간 근무 발생 시 추가 수당은 별도로 지급되나요?"
        );

        return ContractAnalysisResponse.builder()
                .id(contract.getContractId())
                .fileName(contract.getFileName())
                .uploadedAt(uploadedAtStr)
                .totalPages(4)
                .overallRiskLevel("MEDIUM")
                .riskItemCount(3)
                .highRiskCount(1)
                .mediumRiskCount(2)
                .checkItemCount(5)
                .checkItemNote("휴게시간 · 연장근로 등")
                .contractSummary("1년 계약")
                .contractSummaryNote("주 40시간 · 수습 3개월")
                .riskItems(riskItems)
                .salaryBreakdown(salaryBreakdown)
                .basicInfo(basicInfo)
                .precautions(precautions)
                .questionsForRecruiter(questionsForRecruiter)
                .build();
    }
}