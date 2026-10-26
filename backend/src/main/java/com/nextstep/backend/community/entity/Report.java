package com.nextstep.backend.community.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * 커뮤니티 신고. 글(POST) 또는 댓글(COMMENT) 하나를 한 사람이 한 번만 신고할 수 있다.
 */
@Entity
@Table(
        name = "report",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_report_reporter_target",
                columnNames = {"reporter_id", "target_type", "target_id"}
        )
)
@Getter
@Setter
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 신고 대상 종류: POST / COMMENT
    @Column(name = "target_type", nullable = false, length = 20)
    private String targetType;

    // 신고 대상의 id (글 id 또는 댓글 id)
    @Column(name = "target_id", nullable = false)
    private Long targetId;

    // 댓글을 신고한 경우 그 댓글이 달린 글의 id (관리자가 찾아가기 편하도록)
    @Column(name = "post_id")
    private Long postId;

    // 신고한 회원
    @Column(name = "reporter_id", nullable = false)
    private Long reporterId;

    @Column(name = "reporter_nickname", length = 50)
    private String reporterNickname;

    // 신고당한 작성자 닉네임 (신고 당시 값)
    @Column(name = "reported_nickname")
    private String reportedNickname;

    // 신고 사유: 욕설/비방, 광고/스팸, 개인정보 노출, 기타
    @Column(nullable = false, length = 30)
    private String reason;

    // 상세 내용 ("기타"일 때는 필수)
    @Column(columnDefinition = "TEXT")
    private String detail;

    // 처리 상태: PENDING(접수) → 관리자가 확인한 뒤 RESOLVED / REJECTED 로 바꿔 쓴다
    @Column(nullable = false, length = 20)
    private String status = "PENDING";

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}