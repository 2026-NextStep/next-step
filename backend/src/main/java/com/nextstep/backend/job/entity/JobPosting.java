package com.nextstep.backend.job.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "job_posting_list")
public class JobPosting {

    @Id
    @Column(name = "posting_id")
    private Long postingId;

    @Column(name = "company_name")
    private String companyName;

    @Column(name = "job_title")
    private String jobTitle;

    @Column(name = "status")
    private String status;

    @Column(name = "employment_type")
    private String employmentType;

    @Column(name = "recruit_type")
    private String recruitType;

    @Column(name = "work_location")
    private String workLocation;

    @Column(name = "recruit_field")
    private String recruitField;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "view_count")
    private Integer viewCount;

    @Column(name = "scrap_count")
    private Integer scrapCount;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Long getPostingId()        { return postingId; }
    public String getCompanyName()    { return companyName; }
    public String getJobTitle()       { return jobTitle; }
    public String getStatus()         { return status; }
    public String getEmploymentType() { return employmentType; }
    public String getRecruitType()    { return recruitType; }
    public String getWorkLocation()   { return workLocation; }
    public String getRecruitField()   { return recruitField; }
    public LocalDate getStartDate()   { return startDate; }
    public LocalDate getEndDate()     { return endDate; }
    public Integer getViewCount()     { return viewCount; }
    public Integer getScrapCount()    { return scrapCount; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
