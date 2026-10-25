package com.nextstep.backend.info.dto;

import com.nextstep.backend.info.entity.LatestInfo;

import java.time.format.DateTimeFormatter;

public class LatestInfoDetailDto {

    private Long id;
    private String title;
    private String subTitle;
    private String aiSummary3lines;
    private String aiFullSummary;
    private String aiTodayBrief;
    private String aiAction;
    private String createdAt;

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy.MM.dd");

    public static LatestInfoDetailDto from(LatestInfo e) {
        LatestInfoDetailDto dto = new LatestInfoDetailDto();
        dto.id              = e.getId();
        dto.title           = e.getTitle();
        dto.subTitle        = e.getSubTitle();
        dto.aiSummary3lines = e.getAiSummary3lines();
        dto.aiFullSummary   = e.getAiFullSummary();
        dto.aiTodayBrief    = e.getAiTodayBrief();
        dto.aiAction        = e.getAiAction();
        dto.createdAt       = e.getCreatedAt() != null ? e.getCreatedAt().format(FORMATTER) : "";
        return dto;
    }

    public Long getId()               { return id; }
    public String getTitle()          { return title; }
    public String getSubTitle()       { return subTitle; }
    public String getAiSummary3lines(){ return aiSummary3lines; }
    public String getAiFullSummary()  { return aiFullSummary; }
    public String getAiTodayBrief()   { return aiTodayBrief; }
    public String getAiAction()       { return aiAction; }
    public String getCreatedAt()      { return createdAt; }
}
