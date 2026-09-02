package com.nextstep.backend.contract.entity;

import com.nextstep.backend.member.entity.Member;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "contract_document")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ContractDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "contract_id")
    private Long contractId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Column(name = "file_path", nullable = false, length = 500)
    private String filePath;

    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    @Lob
    @Column(name = "ocr_result", columnDefinition = "LONGTEXT")
    private String ocrResult;

    @Lob
    @Column(name = "analysis_result", columnDefinition = "LONGTEXT")
    private String analysisResult;

    @Column(name = "risk_items", columnDefinition = "TEXT")
    private String riskItems;

    @Column(name = "required_items", columnDefinition = "TEXT")
    private String requiredItems;

    @Lob
    @Column(name = "analysis_report", columnDefinition = "LONGTEXT")
    private String analysisReport;

    @Column(name = "net_salary_calc", columnDefinition = "TEXT")
    private String netSalaryCalc;

    @Column(name = "confirm_questions", columnDefinition = "TEXT")
    private String confirmQuestions;

    @Column(name = "uploaded_at", nullable = false, updatable = false)
    private LocalDateTime uploadedAt;

    @Column(name = "analyzed_at")
    private LocalDateTime analyzedAt;

    @Builder
    public ContractDocument(Member member, String filePath, String fileName) {
        this.member = member;
        this.filePath = filePath;
        this.fileName = fileName;
    }

    @PrePersist
    protected void onCreate() {
        if (this.uploadedAt == null) {
            this.uploadedAt = LocalDateTime.now();
        }
    }

    // 분석 결과 업데이트 메서드
    public void updateAnalysisResult(
            String ocrResult,
            String analysisResult,
            String riskItems,
            String requiredItems,
            String analysisReport,
            String netSalaryCalc,
            String confirmQuestions
    ) {
        this.ocrResult = ocrResult;
        this.analysisResult = analysisResult;
        this.riskItems = riskItems;
        this.requiredItems = requiredItems;
        this.analysisReport = analysisReport;
        this.netSalaryCalc = netSalaryCalc;
        this.confirmQuestions = confirmQuestions;
    }

    public void saveAnalysisResult(String json) {
        this.analysisResult = json;
        this.analyzedAt = LocalDateTime.now();
    }
}
