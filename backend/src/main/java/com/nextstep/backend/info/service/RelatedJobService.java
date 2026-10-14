package com.nextstep.backend.info.service;

import com.nextstep.backend.info.dto.RelatedJobDto;
import com.nextstep.backend.info.entity.LatestInfo;
import com.nextstep.backend.info.repository.LatestInfoRepository;
import com.nextstep.backend.job.dto.JobPostingDto;
import com.nextstep.backend.job.entity.JobPosting;
import com.nextstep.backend.job.repository.JobBookmarkRepository;
import com.nextstep.backend.job.repository.JobPostingRepository;
import com.nextstep.backend.job.spec.JobPostingSpec;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.*;

/**
 * 최신정보 상세 → 관련 채용공고 연결.
 * 우선순위: ① 기사에 이름이 등장하는 기관의 공고 → ② 기사 주제와 같은 NCS 분야 공고 → ③ 인기/마감임박 공고로 채움.
 * 후보는 접수 중인 공고(마감일 미경과)만 대상으로 한다.
 */
@Service
public class RelatedJobService {

    private static final int MAX_PER_COMPANY = 2;
    private static final int MIN_COMPANY_NAME_LENGTH = 3;

    /** 기사 키워드 → 공고 recruit_field(NCS 분류)에 포함된 분야명 */
    private static final Map<String, String> KEYWORD_TO_FIELD = new LinkedHashMap<>();
    static {
        for (String k : List.of("IT", "AI", "개발자", "소프트웨어", "데이터", "디지털", "정보보안", "클라우드"))
            KEYWORD_TO_FIELD.put(k, "정보통신");
        for (String k : List.of("의료", "병원", "간호", "보건"))
            KEYWORD_TO_FIELD.put(k, "보건.의료");
        for (String k : List.of("에너지", "원전", "환경", "안전"))
            KEYWORD_TO_FIELD.put(k, "환경.에너지.안전");
        for (String k : List.of("전력", "반도체", "전기", "전자"))
            KEYWORD_TO_FIELD.put(k, "전기.전자");
        for (String k : List.of("금융", "은행", "보험", "증권"))
            KEYWORD_TO_FIELD.put(k, "금융.보험");
        for (String k : List.of("연구", "R&D", "연구원"))
            KEYWORD_TO_FIELD.put(k, "연구");
        for (String k : List.of("건설", "SOC", "토목"))
            KEYWORD_TO_FIELD.put(k, "건설");
        for (String k : List.of("사무", "행정", "경영", "회계"))
            KEYWORD_TO_FIELD.put(k, "경영.회계.사무");
    }

    /** 카테고리만으로 분야를 짐작할 수 있는 경우 */
    private static final Map<String, String> CATEGORY_TO_FIELD = Map.of(
            "IT·스타트업 채용 트렌드", "정보통신"
    );

    private static final Comparator<JobPosting> POPULAR_THEN_DEADLINE = Comparator
            .comparing((JobPosting j) -> j.getScrapCount() != null ? j.getScrapCount() : 0, Comparator.reverseOrder())
            .thenComparing(JobPosting::getEndDate, Comparator.nullsLast(Comparator.naturalOrder()));

    private final LatestInfoRepository infoRepository;
    private final JobPostingRepository jobRepository;
    private final JobBookmarkRepository bookmarkRepository;

    public RelatedJobService(LatestInfoRepository infoRepository,
                             JobPostingRepository jobRepository,
                             JobBookmarkRepository bookmarkRepository) {
        this.infoRepository     = infoRepository;
        this.jobRepository      = jobRepository;
        this.bookmarkRepository = bookmarkRepository;
    }

    public List<RelatedJobDto> getRelatedJobs(Long infoId, int limit, Long memberId) {
        LatestInfo info = infoRepository.findById(infoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "게시글을 찾을 수 없습니다."));

        String text = String.join(" ",
                Objects.toString(info.getTitle(), ""),
                Objects.toString(info.getSubTitle(), ""),
                Objects.toString(info.getAiFullSummary(), ""),
                Objects.toString(info.getAiTodayBrief(), ""));

        List<JobPosting> open = new ArrayList<>(jobRepository.findAll(JobPostingSpec.excludeExpiredUnless(null)));
        open.sort(POPULAR_THEN_DEADLINE);

        Map<Long, RelatedJobDto> picked = new LinkedHashMap<>();
        Set<Long> bookmarkedIds = memberId != null
                ? bookmarkRepository.findPostingIdSetByMemberId(memberId)
                : Collections.emptySet();

        // ① 기사에 언급된 기관
        Map<String, Integer> perCompany = new HashMap<>();
        for (JobPosting job : open) {
            if (picked.size() >= limit) break;
            String company = normalizeCompany(job.getCompanyName());
            if (company.length() < MIN_COMPANY_NAME_LENGTH || !text.contains(company)) continue;
            if (perCompany.merge(company, 1, Integer::sum) > MAX_PER_COMPANY) continue;
            add(picked, job, "기사에 언급된 " + company + " 공고예요", bookmarkedIds);
        }

        // ② 같은 분야
        Set<String> fields = detectFields(text, info.getCategory());
        for (JobPosting job : open) {
            if (picked.size() >= limit) break;
            String recruitField = Objects.toString(job.getRecruitField(), "");
            fields.stream()
                    .filter(recruitField::contains)
                    .findFirst()
                    .ifPresent(f -> add(picked, job, "기사와 같은 " + f.replace('.', '·') + " 분야 공고예요", bookmarkedIds));
        }

        // ③ 인기 / 마감임박으로 채움
        LocalDate soon = LocalDate.now().plusDays(7);
        for (JobPosting job : open) {
            if (picked.size() >= limit) break;
            int scraps = job.getScrapCount() != null ? job.getScrapCount() : 0;
            String reason = scraps > 0 ? "지금 많이 스크랩하는 공고예요"
                    : (job.getEndDate() != null && !job.getEndDate().isAfter(soon)) ? "곧 마감되는 공고예요"
                    : "지금 접수 중인 공고예요";
            add(picked, job, reason, bookmarkedIds);
        }

        return new ArrayList<>(picked.values());
    }

    private static void add(Map<Long, RelatedJobDto> picked, JobPosting job, String reason, Set<Long> bookmarkedIds) {
        picked.putIfAbsent(job.getPostingId(),
                new RelatedJobDto(JobPostingDto.from(job, bookmarkedIds.contains(job.getPostingId())), reason));
    }

    private static Set<String> detectFields(String text, String category) {
        Set<String> fields = new LinkedHashSet<>();
        KEYWORD_TO_FIELD.forEach((keyword, field) -> {
            if (text.contains(keyword)) fields.add(field);
        });
        if (category != null && CATEGORY_TO_FIELD.containsKey(category)) {
            fields.add(CATEGORY_TO_FIELD.get(category));
        }
        return fields;
    }

    private static String normalizeCompany(String name) {
        if (name == null) return "";
        return name.replaceAll("\\(주\\)|㈜|주식회사|\\(재\\)|재단법인|\\(사\\)|사단법인", "")
                .replaceAll("\\s+", "")
                .trim();
    }
}
