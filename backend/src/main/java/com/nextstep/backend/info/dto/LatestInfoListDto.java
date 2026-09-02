package com.nextstep.backend.info.dto;

import com.nextstep.backend.info.entity.LatestInfo;

import java.time.format.DateTimeFormatter;

public class LatestInfoListDto {

    private Long id;
    private String title;
    private String subTitle;
    private String aiSummary3lines;
    private String aiFullSummary;
    private String createdAt;

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy.MM.dd");

    public static LatestInfoListDto from(LatestInfo e) {
        LatestInfoListDto dto = new LatestInfoListDto();
        dto.id              = e.getId();
        dto.title           = e.getTitle();
        dto.subTitle        = e.getSubTitle();
        dto.aiSummary3lines = e.getAiSummary3lines();
        dto.aiFullSummary   = e.getAiFullSummary();
        dto.createdAt       = e.getCreatedAt() != null ? e.getCreatedAt().format(FORMATTER) : "";
        return dto;
    }

    public Long getId()               { return id; }
    public String getTitle()          { return title; }
    public String getSubTitle()       { return subTitle; }
    public String getAiSummary3lines(){ return aiSummary3lines; }
    public String getAiFullSummary()  { return aiFullSummary; }
    public String getCreatedAt()      { return createdAt; }
}
