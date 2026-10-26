package com.nextstep.backend.coverletter.service;

import com.nextstep.backend.coverletter.agent.AgentModels;
import com.nextstep.backend.coverletter.agent.AgentModels.SourceText;
import com.nextstep.backend.coverletter.agent.AgentText;
import com.nextstep.backend.coverletter.agent.EvidenceVerifier;
import com.nextstep.backend.job.entity.JobPosting;
import com.nextstep.backend.job.entity.JobPostingDetail;
import com.nextstep.backend.job.repository.JobPostingDetailRepository;
import com.nextstep.backend.job.repository.JobPostingRepository;
import com.nextstep.backend.job.spec.JobPostingSpec;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

/**
 * 자소서에 연결할 채용공고를 찾아 AI Agent 가 쓸 "직무 기준 자료"로 만든다.
 *  - jobPostingId 가 오면 그 공고를 쓴다.
 *  - 없으면 지원 회사 이름이 기관명에 들어 있는 공고 중 지원 직무와 가장 비슷한 것을 고른다.
 *  - 찾지 못하면 비워 둔다. (이때는 화면에 "공고 근거 없음"으로 정직하게 표시된다)
 * 공고 데이터는 공공기관 채용(ALIO) 기준이라, 민간 기업 이름으로는 찾지 못하는 것이 정상이다.
 */
@Service
@RequiredArgsConstructor
public class JobPostingLookup {

    private final JobPostingRepository       postingRepository;
    private final JobPostingDetailRepository detailRepository;

    public Optional<SourceText> find(Long postingId, String company, String position) {
        JobPosting posting = null;
        if (postingId != null) {
            posting = postingRepository.findById(postingId).orElse(null);
        }
        if (posting == null) {
            posting = autoMatch(company, position);
        }
        if (posting == null) {
            return Optional.empty();
        }

        JobPostingDetail detail = detailRepository.findById(posting.getPostingId()).orElse(null);

        String title = AgentText.nullToEmpty(posting.getJobTitle()).trim();
        String deadline = posting.getEndDate() == null ? "" : " · 마감 " + posting.getEndDate();
        String line = AgentText.nullToEmpty(posting.getCompanyName()).trim() + deadline;

        return Optional.of(new SourceText(
                "J1", AgentModels.SRC_JOB_POSTING,
                title.isEmpty() ? "채용공고 #" + posting.getPostingId() : title,
                line, "/jobs/" + posting.getPostingId(),
                buildText(posting, detail)));
    }

    private JobPosting autoMatch(String company, String position) {
        String c = AgentText.nullToEmpty(company).trim();
        if (c.isEmpty()) return null;

        List<JobPosting> candidates = postingRepository.findAll(
                JobPostingSpec.searchKeyword(c),
                PageRequest.of(0, 30, Sort.by(Sort.Direction.DESC, "endDate"))
        ).getContent();

        String wanted = EvidenceVerifier.normalize(c);
        Set<String> positionTokens = tokens(position);

        JobPosting best = null;
        int bestScore = -1;
        for (JobPosting p : candidates) {
            if (p.getCompanyName() == null || !EvidenceVerifier.normalize(p.getCompanyName()).contains(wanted)) {
                continue; // 회사 이름이 다른 공고는 쓰지 않는다
            }
            String haystack = (AgentText.nullToEmpty(p.getJobTitle()) + " " + AgentText.nullToEmpty(p.getRecruitField())).toLowerCase();
            int score = 0;
            for (String t : positionTokens) {
                if (haystack.contains(t)) score++;
            }
            if (p.getEndDate() != null && !p.getEndDate().isBefore(LocalDate.now())) {
                score++; // 접수 중인 공고를 조금 우대
            }
            if (score > bestScore) {
                best = p;
                bestScore = score;
            }
        }
        return best;
    }

    private Set<String> tokens(String text) {
        Set<String> out = new HashSet<>();
        for (String t : AgentText.nullToEmpty(text).toLowerCase().split("[\\s,/·]+")) {
            if (t.length() >= 2) out.add(t);
        }
        return out;
    }

    private String buildText(JobPosting p, JobPostingDetail d) {
        StringBuilder sb = new StringBuilder();
        sb.append("공고명: ").append(AgentText.nullToEmpty(p.getJobTitle())).append('\n');
        sb.append("기관: ").append(AgentText.nullToEmpty(p.getCompanyName())).append('\n');
        sb.append("고용형태: ").append(AgentText.nullToEmpty(p.getEmploymentType())).append('\n');
        sb.append("채용분야: ").append(AgentText.nullToEmpty(p.getRecruitField())).append('\n');
        sb.append("근무지: ").append(AgentText.nullToEmpty(p.getWorkLocation())).append('\n');
        if (d != null) {
            sb.append("학력: ").append(AgentText.nullToEmpty(d.getEducation())).append('\n');
            sb.append("자격요건: ").append(AgentText.flattenJson(d.getQualificationItems())).append('\n');
            sb.append("모집분야: ").append(AgentText.flattenJson(d.getRecruitPositions())).append('\n');
            sb.append("전형절차: ").append(AgentText.flattenJson(d.getSelectionSteps())).append('\n');
        }
        return sb.toString();
    }
}