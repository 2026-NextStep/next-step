package com.nextstep.backend.info.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "latest_info")
public class LatestInfo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "info_id")
    private Long id;

    @Column(length = 300, nullable = false)
    private String title;

    @Column(name = "sub_title", columnDefinition = "TEXT")
    private String subTitle;

    @Column(name = "ai_summary_3lines", columnDefinition = "TEXT")
    private String aiSummary3lines;

    @Column(name = "ai_full_summary", columnDefinition = "TEXT")
    private String aiFullSummary;

    @Column(name = "ai_today_brief", columnDefinition = "TEXT")
    private String aiTodayBrief;

    @Column(name = "ai_action", columnDefinition = "TEXT")
    private String aiAction;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    public Long getId()               { return id; }
    public String getTitle()          { return title; }
    public String getSubTitle()       { return subTitle; }
    public String getAiSummary3lines(){ return aiSummary3lines; }
    public String getAiFullSummary()  { return aiFullSummary; }
    public String getAiTodayBrief()   { return aiTodayBrief; }
    public String getAiAction()       { return aiAction; }
    public LocalDateTime getCreatedAt(){ return createdAt; }
}
