package com.nextstep.backend.info.controller;

import com.nextstep.backend.common.util.SecurityUtil;
import com.nextstep.backend.info.dto.LatestInfoDetailDto;
import com.nextstep.backend.info.dto.LatestInfoListDto;
import com.nextstep.backend.info.dto.RecommendedInfoResponse;
import com.nextstep.backend.info.dto.RelatedJobDto;
import com.nextstep.backend.info.service.LatestInfoRecommendService;
import com.nextstep.backend.info.service.LatestInfoService;
import com.nextstep.backend.info.service.RelatedJobService;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/latest-info")
public class LatestInfoController {

    private final LatestInfoService service;
    private final LatestInfoRecommendService recommendService;
    private final RelatedJobService relatedJobService;
    private final SecurityUtil securityUtil;

    public LatestInfoController(LatestInfoService service,
                                LatestInfoRecommendService recommendService,
                                RelatedJobService relatedJobService,
                                SecurityUtil securityUtil) {
        this.service           = service;
        this.recommendService  = recommendService;
        this.relatedJobService = relatedJobService;
        this.securityUtil      = securityUtil;
    }

    @GetMapping
    public Page<LatestInfoListDto> getList(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "") String category,
            @RequestParam(defaultValue = "") String month) {
        return service.getList(page, size, category, month);
    }

    /** 로그인 사용자의 희망직무 기반 맞춤 소식 (비로그인 시 403) */
    @GetMapping("/recommended")
    public RecommendedInfoResponse getRecommended() {
        return recommendService.recommend(securityUtil.getCurrentMemberId());
    }

    @GetMapping("/{id}")
    public LatestInfoDetailDto getDetail(@PathVariable Long id) {
        return service.getDetail(id);
    }

    @GetMapping("/{id}/related-jobs")
    public List<RelatedJobDto> getRelatedJobs(@PathVariable Long id,
                                              @RequestParam(defaultValue = "4") int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 12));
        return relatedJobService.getRelatedJobs(id, safeLimit, securityUtil.getCurrentMemberIdOrNull());
    }
}
