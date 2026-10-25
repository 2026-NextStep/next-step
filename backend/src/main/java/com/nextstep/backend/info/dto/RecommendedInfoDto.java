package com.nextstep.backend.info.dto;

import com.nextstep.backend.info.entity.LatestInfo;

import java.time.format.DateTimeFormatter;

/** 맞춤 소식 카드 1개 — 최신정보 요약 + AI가 붙인 추천 이유 한 줄. */
public class RecommendedInfoDto {

    private Long id;
    private String title;
    private String subTitle;
    private String aiSummary3lines;
    private String category;
    private String createdAt;
    private String reason;

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy.MM.dd");

    public static RecommendedInfoDto from(LatestInfo e, String reason) {
        RecommendedInfoDto dto = new RecommendedInfoDto();
        dto.id              = e.getId();
        dto.title           = e.getTitle();
        dto.subTitle        = e.getSubTitle();
        dto.aiSummary3lines = e.getAiSummary3lines();
        dto.category        = e.getCategory();
        dto.createdAt       = e.getCreatedAt() != null ? e.getCreatedAt().format(FORMATTER) : "";
        dto.reason          = reason;
        return dto;
    }

    public Long getId()               { return id; }
    public String getTitle()          { return title; }
    public String getSubTitle()       { return subTitle; }
    public String getAiSummary3lines(){ return aiSummary3lines; }
    public String getCategory()       { return category; }
    public String getCreatedAt()      { return createdAt; }
    public String getReason()         { return reason; }
}
