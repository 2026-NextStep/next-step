package com.nextstep.backend.community.service;

import com.nextstep.backend.common.util.JobCategoryGuesser;
import com.nextstep.backend.common.util.PersonalInfoMasker;
import com.nextstep.backend.common.util.SecurityUtil;
import com.nextstep.backend.community.dto.PostRequest;
import com.nextstep.backend.community.dto.PostResponseDto;
import com.nextstep.backend.coverletter.entity.Resume;
import com.nextstep.backend.coverletter.entity.ResumeQuestion;
import com.nextstep.backend.coverletter.repository.ResumeRepository;
import com.nextstep.backend.member.entity.Member;
import com.nextstep.backend.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.List;

/**
 * 내 자소서를 커뮤니티 "자소서" 카테고리에 첨삭 요청글로 올린다.
 * 개인정보(전화번호, 이메일, 주민등록번호)는 서버에서 가린 뒤 저장한다.
 */
@Service
@RequiredArgsConstructor
public class ResumeShareService {

    private static final String CATEGORY    = "자소서";
    private static final String TITLE_LABEL = "[자소서 첨삭] ";
    private static final int    MAX_TITLE   = 100;

    private final ResumeRepository resumeRepository;
    private final MemberRepository memberRepository;
    private final CommunityService communityService;
    private final SecurityUtil     securityUtil;

    @Transactional
    public PostResponseDto shareToCommunity(Long resumeId) {
        // 로그인한 사용자만 가능 (아니면 403 + "로그인이 필요합니다.")
        Long memberId = securityUtil.getCurrentMemberId();
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalStateException("회원 정보를 찾을 수 없습니다."));

        // 내 자소서만 올릴 수 있다. Resume.username 에는 로그인 아이디가 아니라 닉네임이 저장된다.
        // 남의 자소서이거나 없으면 존재 여부를 알려주지 않도록 똑같이 404 로 답한다.
        Resume resume = resumeRepository.findById(resumeId)
                .filter(r -> member.getNickname().equals(r.getUsername()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "자기소개서를 찾을 수 없습니다."));

        List<ResumeQuestion> questions = resume.getQuestions().stream()
                .sorted(Comparator.comparingInt(ResumeQuestion::getQuestionNumber))
                .toList();

        boolean hasContent = questions.stream()
                .anyMatch(q -> q.getAnswer() != null && !q.getAnswer().isBlank());
        if (!hasContent) {
            throw new IllegalArgumentException("공유할 자기소개서 내용이 없습니다.");
        }

        String title = PersonalInfoMasker.mask(TITLE_LABEL + nullToEmpty(resume.getTitle()).trim());
        if (title.length() > MAX_TITLE) {
            title = title.substring(0, MAX_TITLE);
        }

        PostRequest request = new PostRequest();
        request.setCategory(CATEGORY);
        request.setTitle(title);
        request.setContent(PersonalInfoMasker.mask(buildContent(resume, questions)));
        request.setJob(JobCategoryGuesser.guess(resume.getPosition()));
        request.setWriter(member.getNickname());

        return communityService.createPost(request);
    }

    // 글 본문: 지원 정보 + 문항별 질문/답변
    private String buildContent(Resume resume, List<ResumeQuestion> questions) {
        StringBuilder sb = new StringBuilder();
        sb.append("아래 자기소개서에 대한 피드백을 부탁드립니다.\n");

        String company  = nullToEmpty(resume.getCompany()).trim();
        String position = nullToEmpty(resume.getPosition()).trim();
        if (!company.isEmpty())  sb.append("지원 회사: ").append(company).append('\n');
        if (!position.isEmpty()) sb.append("지원 직무: ").append(position).append('\n');
        sb.append('\n');

        for (ResumeQuestion q : questions) {
            String answer = nullToEmpty(q.getAnswer()).trim();
            sb.append("[문항 ").append(q.getQuestionNumber()).append("] ")
                    .append(nullToEmpty(q.getQuestion()).trim()).append('\n')
                    .append(answer.isEmpty() ? "(작성된 내용 없음)" : answer)
                    .append("\n\n");
        }
        return sb.toString().trim();
    }

    private static String nullToEmpty(String s) {
        return s == null ? "" : s;
    }
}