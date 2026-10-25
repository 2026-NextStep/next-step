package com.nextstep.backend.job.dto;

import com.nextstep.backend.job.entity.JobPosting;
import com.nextstep.backend.job.entity.JobPostingDetail;

import java.time.format.DateTimeFormatter;

public class JobPostingDetailDto {

    private Long id;
    private String status;
    private String title;
    private String org;
    private String field;
    private String recruitType;
    private String start;
    private String end;
    private String employmentType;
    private String workLocation;
    private int scrapCount;
    private String recruitCount;
    private String education;
    private String originalLink;
    private String recruitPositions;
    private String qualificationItems;
    private String selectionSteps;

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy.MM.dd");

    public static JobPostingDetailDto from(JobPosting list, JobPostingDetail detail) {
        JobPostingDetailDto dto = new JobPostingDetailDto();
        dto.id             = list.getPostingId();
        dto.status         = list.getStatus();
        dto.title          = list.getJobTitle();
        dto.org            = list.getCompanyName();
        dto.field          = list.getRecruitField();
        dto.recruitType    = list.getRecruitType();
        dto.start          = list.getStartDate() != null ? list.getStartDate().format(FORMATTER) : "";
        dto.end            = list.getEndDate()   != null ? list.getEndDate().format(FORMATTER)   : "";
        dto.employmentType = list.getEmploymentType();
        dto.workLocation   = list.getWorkLocation();
        dto.scrapCount     = list.getScrapCount() != null ? list.getScrapCount() : 0;
        if (detail != null) {
            dto.recruitCount       = detail.getRecruitCount();
            dto.education          = detail.getEducation();
            dto.originalLink       = detail.getOriginalLink();
            dto.recruitPositions   = detail.getRecruitPositions();
            dto.qualificationItems = detail.getQualificationItems();
            dto.selectionSteps     = detail.getSelectionSteps();
        }
        return dto;
    }

    public Long getId()                   { return id; }
    public String getStatus()             { return status; }
    public String getTitle()              { return title; }
    public String getOrg()                { return org; }
    public String getField()              { return field; }
    public String getRecruitType()        { return recruitType; }
    public String getStart()              { return start; }
    public String getEnd()                { return end; }
    public String getEmploymentType()     { return employmentType; }
    public String getWorkLocation()       { return workLocation; }
    public int getScrapCount()            { return scrapCount; }
    public String getRecruitCount()       { return recruitCount; }
    public String getEducation()          { return education; }
    public String getOriginalLink()       { return originalLink; }
    public String getRecruitPositions()   { return recruitPositions; }
    public String getQualificationItems() { return qualificationItems; }
    public String getSelectionSteps()     { return selectionSteps; }
}
