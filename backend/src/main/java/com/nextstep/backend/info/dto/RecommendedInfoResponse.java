package com.nextstep.backend.info.dto;

import java.util.List;

/**
 * "OO님을 위한 맞춤 소식" 응답.
 * desiredJob이 비어 있으면 items도 비어 있고, 프론트는 마이페이지 입력을 유도한다.
 */
public class RecommendedInfoResponse {

    private final String nickname;
    private final String desiredJob;
    private final List<RecommendedInfoDto> items;

    public RecommendedInfoResponse(String nickname, String desiredJob, List<RecommendedInfoDto> items) {
        this.nickname   = nickname;
        this.desiredJob = desiredJob;
        this.items      = items;
    }

    public String getNickname()               { return nickname; }
    public String getDesiredJob()             { return desiredJob; }
    public List<RecommendedInfoDto> getItems(){ return items; }
}
