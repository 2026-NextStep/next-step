package com.nextstep.backend.job.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "ai_posting_summary")
public class JobAiAnalysis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "summary_id")
    private Long summaryId;

    @Column(name = "member_id")
    private Long memberId;

    @Column(name = "posting_id", nullable = false)
    private Long postingId;

    @Column(name = "company_name", length = 100)
    private String companyName;

    @Column(name = "job_title", length = 200)
    private String jobTitle;

    @Column(name = "region", length = 200)
    private String region;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "overview", columnDefinition = "TEXT")
    private String overview;

    @Column(name = "key_info", columnDefinition = "TEXT")
    private String keyInfo;

    @Column(name = "qualification_checklist", columnDefinition = "TEXT")
    private String qualificationChecklist;

    @Column(name = "preference_score", columnDefinition = "TEXT")
    private String preferenceScore;

    @Column(name = "selection_process", columnDefinition = "TEXT")
    private String selectionProcess;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public Long getSummaryId()              { return summaryId; }
    public Long getMemberId()               { return memberId; }
    public Long getPostingId()              { return postingId; }
    public String getCompanyName()          { return companyName; }
    public String getJobTitle()             { return jobTitle; }
    public String getRegion()               { return region; }
    public LocalDate getStartDate()         { return startDate; }
    public LocalDate getEndDate()           { return endDate; }
    public String getOverview()             { return overview; }
    public String getKeyInfo()              { return keyInfo; }
    public String getQualificationChecklist() { return qualificationChecklist; }
    public String getPreferenceScore()      { return preferenceScore; }
    public String getSelectionProcess()     { return selectionProcess; }
    public LocalDateTime getCreatedAt()     { return createdAt; }

    public void setMemberId(Long memberId)              { this.memberId = memberId; }
    public void setPostingId(Long postingId)            { this.postingId = postingId; }
    public void setCompanyName(String companyName)      { this.companyName = companyName; }
    public void setJobTitle(String jobTitle)            { this.jobTitle = jobTitle; }
    public void setRegion(String region)                { this.region = region; }
    public void setStartDate(LocalDate startDate)       { this.startDate = startDate; }
    public void setEndDate(LocalDate endDate)           { this.endDate = endDate; }
    public void setOverview(String overview)            { this.overview = overview; }
    public void setKeyInfo(String keyInfo)              { this.keyInfo = keyInfo; }
    public void setQualificationChecklist(String v)     { this.qualificationChecklist = v; }
    public void setPreferenceScore(String preferenceScore) { this.preferenceScore = preferenceScore; }
    public void setSelectionProcess(String selectionProcess) { this.selectionProcess = selectionProcess; }
    public void setCreatedAt(LocalDateTime createdAt)   { this.createdAt = createdAt; }
}
