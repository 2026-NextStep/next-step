package com.nextstep.backend.job.service;

import com.nextstep.backend.email.service.EmailService;
import com.nextstep.backend.job.entity.JobBookmark;
import com.nextstep.backend.job.entity.JobPosting;
import com.nextstep.backend.job.repository.JobBookmarkRepository;
import com.nextstep.backend.job.repository.JobPostingRepository;
import com.nextstep.backend.member.entity.Member;
import com.nextstep.backend.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * 스크랩한 채용공고의 마감일이 임박(D-3 이내)하면 회원에게 이메일로 한 번만 알림.
 * deadline_alert_sent 플래그로 중복 발송을 막기 때문에, 스케줄러가 며칠 못 돌더라도
 * 다음 실행 때 놓친 알림을 그대로 잡아낼 수 있음(정확한 D-3/D-1 시점 매칭이 아님).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DeadlineAlertService {

    private static final int ALERT_THRESHOLD_DAYS = 3;
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy.MM.dd");

    @Value("${frontend.base-url}")
    private String frontendBaseUrl;

    private final JobBookmarkRepository bookmarkRepository;
    private final JobPostingRepository jobPostingRepository;
    private final MemberRepository memberRepository;
    private final EmailService emailService;

    private record DueAlert(JobBookmark bookmark, JobPosting posting, long dDay) {}

    @Transactional
    public int checkAndSendDeadlineAlerts() {
        List<JobBookmark> pending = bookmarkRepository.findByDeadlineAlertSentFalse();
        if (pending.isEmpty()) return 0;

        LocalDate today = LocalDate.now();
        List<Long> postingIds = pending.stream().map(JobBookmark::getPostingId).distinct().toList();
        Map<Long, JobPosting> postings = jobPostingRepository.findAllById(postingIds).stream()
                .collect(Collectors.toMap(JobPosting::getPostingId, p -> p));

        List<DueAlert> due = pending.stream()
                .map(b -> toDueAlert(b, postings.get(b.getPostingId()), today))
                .filter(Objects::nonNull)
                .toList();

        if (due.isEmpty()) return 0;

        Map<Long, List<DueAlert>> byMember = due.stream()
                .collect(Collectors.groupingBy(d -> d.bookmark().getMemberId()));

        List<Long> sentBookmarkIds = new ArrayList<>();
        int notifiedMembers = 0;
        for (Map.Entry<Long, List<DueAlert>> entry : byMember.entrySet()) {
            Member member = memberRepository.findById(entry.getKey()).orElse(null);
            if (member == null || member.getEmail() == null) continue;

            try {
                emailService.sendDeadlineAlert(
                        member.getEmail(),
                        "[NextStep] 스크랩한 채용공고 " + entry.getValue().size() + "건의 마감이 임박했습니다",
                        buildEmailHtml(member, entry.getValue())
                );
                notifiedMembers++;
                entry.getValue().forEach(d -> sentBookmarkIds.add(d.bookmark().getBookmarkId()));
            } catch (Exception e) {
                log.error("마감임박 알림 메일 발송 실패 - memberId={}", entry.getKey(), e);
            }
        }

        if (!sentBookmarkIds.isEmpty()) {
            bookmarkRepository.markDeadlineAlertSent(sentBookmarkIds);
        }

        return notifiedMembers;
    }

    private DueAlert toDueAlert(JobBookmark bookmark, JobPosting posting, LocalDate today) {
        if (posting == null || posting.getEndDate() == null) return null;
        long dDay = ChronoUnit.DAYS.between(today, posting.getEndDate());
        if (dDay < 0 || dDay > ALERT_THRESHOLD_DAYS) return null;
        return new DueAlert(bookmark, posting, dDay);
    }

    private String buildEmailHtml(Member member, List<DueAlert> dueList) {
        String greetingName = member.getNickname() != null ? member.getNickname() : member.getName();

        StringBuilder cards = new StringBuilder();
        for (DueAlert d : dueList) {
            JobPosting p = d.posting();
            String label = d.dDay() == 0 ? "오늘 마감" : "D-" + d.dDay();
            String jobUrl = frontendBaseUrl + "/jobs/" + p.getPostingId();
            cards.append("""
                <tr>
                  <td style="padding:16px 0;border-bottom:1px solid #eee;">
                    <span style="display:inline-block;background:#fef2f2;color:#dc2626;font-size:12px;font-weight:700;padding:3px 10px;border-radius:12px;margin-bottom:8px;">%s</span>
                    <div style="font-size:12px;color:#9ca3af;margin-top:8px;">%s</div>
                    <a href="%s" style="font-size:16px;font-weight:600;color:#111827;text-decoration:none;line-height:1.4;">%s</a>
                    <div style="font-size:13px;color:#6b7280;margin-top:6px;">%s · %s</div>
                    <div style="font-size:13px;color:#6b7280;margin-top:2px;">마감일: %s</div>
                    <a href="%s" style="display:inline-block;margin-top:10px;font-size:13px;color:#2563eb;text-decoration:none;">공고 자세히 보기 →</a>
                  </td>
                </tr>
                """.formatted(
                    label,
                    escapeHtml(p.getCompanyName()),
                    jobUrl,
                    escapeHtml(p.getJobTitle()),
                    escapeHtml(nullToDash(p.getEmploymentType())),
                    escapeHtml(nullToDash(p.getWorkLocation())),
                    p.getEndDate().format(DATE_FORMAT),
                    jobUrl
            ));
        }

        return """
            <div style="max-width:520px;margin:0 auto;font-family:'Apple SD Gothic Neo','Malgun Gothic',sans-serif;color:#111827;">
              <div style="padding:32px 24px 16px;">
                <h1 style="font-size:20px;margin:0 0 4px;">%s님, 마감이 얼마 안 남았어요!</h1>
                <p style="font-size:14px;color:#6b7280;margin:0;">스크랩하신 채용공고 %d건의 마감일이 곧 다가옵니다.</p>
              </div>
              <table style="width:100%%;border-collapse:collapse;padding:0 24px;" cellpadding="0" cellspacing="0">
                <tbody style="display:block;padding:0 24px;">
                  %s
                </tbody>
              </table>
              <div style="padding:24px;text-align:center;">
                <a href="%s/mypage" style="display:inline-block;background:#2563eb;color:#ffffff;font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none;">마이페이지에서 전체 스크랩 보기</a>
              </div>
              <div style="padding:0 24px 32px;text-align:center;">
                <a href="%s" style="font-size:12px;color:#9ca3af;text-decoration:none;">NextStep 홈페이지 바로가기</a>
              </div>
            </div>
            """.formatted(
                escapeHtml(greetingName),
                dueList.size(),
                cards,
                frontendBaseUrl,
                frontendBaseUrl
        );
    }

    private String nullToDash(String value) {
        return (value == null || value.isBlank()) ? "-" : value;
    }

    private String escapeHtml(String value) {
        if (value == null) return "";
        return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}
