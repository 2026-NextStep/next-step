package com.nextstep.backend.contract.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ContractAnalysisResponse {

    private Long id;
    private String fileName;
    private String uploadedAt;
    private Integer totalPages;
    private String overallRiskLevel;
    private Integer riskItemCount;
    private Integer highRiskCount;
    private Integer mediumRiskCount;
    private Integer checkItemCount;
    private String checkItemNote;
    private String contractSummary;
    private String contractSummaryNote;
    private List<RiskItem> riskItems;
    private SalaryBreakdown salaryBreakdown;
    private BasicInfo basicInfo;
    private List<Precaution> precautions;
    private List<String> questionsForRecruiter;

    @Getter
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class RiskItem {
        private Long id;
        private String title;
        private String level;
        private String description;
        private String reason;
        private String recommendation;
    }

    @Getter
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class SalaryBreakdown {
        private Long grossSalary;
        private Long nationalPension;
        private Long healthInsurance;
        private Long longTermCareInsurance;
        private Long employmentInsurance;
        private Long incomeTax;
        private Long localIncomeTax;
        private Long netSalary;
        private String note;
    }

    @Getter
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class BasicInfo {
        private String companyName;
        private String employerName;
        private String position;
        private String contractPeriod;
        private String workingHours;
        private String probationPeriod;
        private String salary;
    }

    @Getter
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Precaution {
        private String title;
        private String description;
    }
}