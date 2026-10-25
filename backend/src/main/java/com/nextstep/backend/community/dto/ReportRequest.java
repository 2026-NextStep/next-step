package com.nextstep.backend.community.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReportRequest {

    private String targetType; // POST / COMMENT

    private Long targetId;     // 신고할 글 id 또는 댓글 id

    private String reason;     // 욕설/비방, 광고/스팸, 개인정보 노출, 기타

    private String detail;     // 상세 내용 (기타일 때 필수, 그 외 선택)
}