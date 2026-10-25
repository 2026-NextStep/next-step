package com.nextstep.backend.job.dto;

import com.nextstep.backend.job.entity.JobPosting;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

public class JobPostingDto {

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
    private int views;
    private boolean bookmarked;

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy.MM.dd");

    public static JobPostingDto from(JobPosting job) {
        return from(job, false);
    }

    public static JobPostingDto from(JobPosting job, boolean bookmarked) {
        JobPostingDto dto = new JobPostingDto();
        dto.id             = job.getPostingId();
        dto.status         = resolveStatus(job);
        dto.title          = job.getJobTitle();
        dto.org            = job.getCompanyName();
        dto.field          = job.getRecruitField();
        dto.recruitType    = job.getRecruitType();
        dto.start          = job.getStartDate() != null ? job.getStartDate().format(FORMATTER) : "";
        dto.end            = job.getEndDate()   != null ? job.getEndDate().format(FORMATTER)   : "";
        dto.employmentType = job.getEmploymentType();
        dto.workLocation   = job.getWorkLocation();
        dto.views          = job.getScrapCount() != null ? job.getScrapCount() : 0;
        dto.bookmarked     = bookmarked;
        return dto;
    }

    private static String resolveStatus(JobPosting job) {
        LocalDate endDate = job.getEndDate();
        if (endDate == null) return job.getStatus();
        LocalDate today = LocalDate.now();
        if (endDate.isBefore(today)) return "마감";
        if (!endDate.isAfter(today.plusDays(7))) return "마감임박";
        return job.getStatus() != null ? job.getStatus() : "진행중";
    }

    public Long getId()               { return id; }
    public String getStatus()         { return status; }
    public String getTitle()          { return title; }
    public String getOrg()            { return org; }
    public String getField()          { return field; }
    public String getRecruitType()    { return recruitType; }
    public String getStart()          { return start; }
    public String getEnd()            { return end; }
    public String getEmploymentType() { return employmentType; }
    public String getWorkLocation()   { return workLocation; }
    public int getViews()             { return views; }
    public boolean isBookmarked()     { return bookmarked; }
}
