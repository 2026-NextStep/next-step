package com.nextstep.backend.community.service;

import com.nextstep.backend.common.util.SecurityUtil;
import com.nextstep.backend.community.dto.ReportRequest;
import com.nextstep.backend.community.entity.Comment;
import com.nextstep.backend.community.entity.Post;
import com.nextstep.backend.community.entity.Report;
import com.nextstep.backend.community.repository.CommentRepository;
import com.nextstep.backend.community.repository.PostRepository;
import com.nextstep.backend.community.repository.ReportRepository;
import com.nextstep.backend.member.entity.Member;
import com.nextstep.backend.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ReportService {

    private static final String TYPE_POST    = "POST";
    private static final String TYPE_COMMENT = "COMMENT";
    private static final String REASON_OTHER = "기타";
    private static final Set<String> REASONS = Set.of("욕설/비방", "광고/스팸", "개인정보 노출", REASON_OTHER);
    private static final int MAX_DETAIL_LENGTH = 500;

    private final ReportRepository  reportRepository;
    private final PostRepository    postRepository;
    private final CommentRepository commentRepository;
    private final MemberRepository  memberRepository;
    private final SecurityUtil      securityUtil;

    /**
     * 글 또는 댓글 신고 접수. 신고자는 요청 본문이 아니라 로그인 토큰에서 가져온다.
     * (로그인하지 않았으면 SecurityUtil 이 403 + "로그인이 필요합니다."를 돌려준다)
     */
    @Transactional
    public void report(ReportRequest request) {
        Long reporterId = securityUtil.getCurrentMemberId();
        Member reporter = memberRepository.findById(reporterId)
                .orElseThrow(() -> new IllegalStateException("회원 정보를 찾을 수 없습니다."));

        // ── 입력 검사 ──
        String targetType = request.getTargetType() == null ? "" : request.getTargetType().trim().toUpperCase();
        if (!TYPE_POST.equals(targetType) && !TYPE_COMMENT.equals(targetType)) {
            throw new IllegalArgumentException("신고 대상이 올바르지 않습니다.");
        }
        if (request.getTargetId() == null) {
            throw new IllegalArgumentException("신고 대상이 올바르지 않습니다.");
        }

        String reason = request.getReason() == null ? "" : request.getReason().trim();
        if (!REASONS.contains(reason)) {
            throw new IllegalArgumentException("신고 사유를 선택해 주세요.");
        }

        String detail = request.getDetail() == null ? "" : request.getDetail().trim();
        if (REASON_OTHER.equals(reason) && detail.isEmpty()) {
            throw new IllegalArgumentException("기타 사유를 입력해 주세요.");
        }
        if (detail.length() > MAX_DETAIL_LENGTH) {
            throw new IllegalArgumentException("신고 내용은 " + MAX_DETAIL_LENGTH + "자 이내로 입력해 주세요.");
        }

        // ── 신고 대상 확인 ──
        String reportedNickname;
        Long postId;
        String targetName;

        if (TYPE_POST.equals(targetType)) {
            Post post = postRepository.findById(request.getTargetId())
                    .orElseThrow(() -> new IllegalArgumentException("신고할 글을 찾을 수 없습니다."));
            reportedNickname = post.getWriter();
            postId = post.getId();
            targetName = "글";
        } else {
            Comment comment = commentRepository.findById(request.getTargetId())
                    .orElseThrow(() -> new IllegalArgumentException("신고할 댓글을 찾을 수 없습니다."));
            if (comment.isDeleted()) {
                throw new IllegalArgumentException("이미 삭제된 댓글입니다.");
            }
            reportedNickname = comment.getWriter();
            postId = comment.getPost() != null ? comment.getPost().getId() : null;
            targetName = "댓글";
        }

        // 본인이 쓴 글/댓글은 신고할 수 없다
        if (reportedNickname != null && reportedNickname.equals(reporter.getNickname())) {
            throw new IllegalArgumentException("본인이 작성한 " + targetName + "은(는) 신고할 수 없습니다.");
        }

        // 같은 대상은 한 번만 신고할 수 있다
        if (reportRepository.existsByReporterIdAndTargetTypeAndTargetId(reporterId, targetType, request.getTargetId())) {
            throw new IllegalArgumentException("이미 신고한 " + targetName + "입니다.");
        }

        // ── 저장 ──
        Report report = new Report();
        report.setTargetType(targetType);
        report.setTargetId(request.getTargetId());
        report.setPostId(postId);
        report.setReporterId(reporterId);
        report.setReporterNickname(reporter.getNickname());
        report.setReportedNickname(reportedNickname);
        report.setReason(reason);
        report.setDetail(detail.isEmpty() ? null : detail);
        report.setCreatedAt(LocalDateTime.now());
        reportRepository.save(report);
    }
}