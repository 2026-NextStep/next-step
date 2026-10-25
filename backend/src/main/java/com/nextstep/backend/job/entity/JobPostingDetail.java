package com.nextstep.backend.job.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "job_posting_detail")
public class JobPostingDetail {

    @Id
    @Column(name = "posting_id")
    private Long postingId;

    @Column(name = "recruit_count")
    private String recruitCount;

    @Column(name = "education")
    private String education;

    @Column(name = "original_link")
    private String originalLink;

    @Column(name = "recruit_positions", columnDefinition = "JSON")
    private String recruitPositions;

    @Column(name = "qualification_items", columnDefinition = "JSON")
    private String qualificationItems;

    @Column(name = "selection_steps", columnDefinition = "JSON")
    private String selectionSteps;

    public Long getPostingId()              { return postingId; }
    public String getRecruitCount()         { return recruitCount; }
    public String getEducation()            { return education; }
    public String getOriginalLink()         { return originalLink; }
    public String getRecruitPositions()     { return recruitPositions; }
    public String getQualificationItems()   { return qualificationItems; }
    public String getSelectionSteps()       { return selectionSteps; }
}
