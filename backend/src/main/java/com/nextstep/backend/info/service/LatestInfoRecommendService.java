package com.nextstep.backend.info.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nextstep.backend.info.dto.RecommendedInfoDto;
import com.nextstep.backend.info.dto.RecommendedInfoResponse;
import com.nextstep.backend.info.entity.LatestInfo;
import com.nextstep.backend.info.repository.LatestInfoRepository;
import com.nextstep.backend.member.entity.Member;
import com.nextstep.backend.member.repository.MemberRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * 희망직무 기반 "맞춤 소식" 추천.
 * 최근 최신정보 60건을 후보로 AI 서버(/api/latest-info/recommend)에 넘겨 관련도 높은 기사와 이유를 받는다.
 * LLM 호출 비용을 줄이기 위해 (희망직무, 최신 기사 id) 단위로 하루 동안 캐시하고,
 * AI 서버 호출 실패 시에는 키워드 매칭으로 대체한다(이 경우 캐시하지 않아 다음 요청에서 AI 재시도).
 */
@Service
public class LatestInfoRecommendService {

    private static final Logger log = LoggerFactory.getLogger(LatestInfoRecommendService.class);
    private static final int LIMIT = 4;

    private final LatestInfoRepository infoRepository;
    private final MemberRepository memberRepository;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Map<String, CachedPicks> cache = new ConcurrentHashMap<>();

    @Value("${ai.server.url:http://localhost:8000}")
    private String aiServerUrl;

    public LatestInfoRecommendService(LatestInfoRepository infoRepository, MemberRepository memberRepository) {
        this.infoRepository   = infoRepository;
        this.memberRepository = memberRepository;
    }

    private record Pick(Long id, String reason) {}

    private record CachedPicks(LocalDate date, List<Pick> picks) {}

    public RecommendedInfoResponse recommend(Long memberId) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "회원 정보를 찾을 수 없습니다."));
        String desiredJob = member.getDesiredJob() != null ? member.getDesiredJob().trim() : "";
        if (desiredJob.isEmpty()) {
            return new RecommendedInfoResponse(member.getNickname(), null, List.of());
        }

        // 수집 중복으로 같은 제목 기사가 여러 건일 수 있어 최신 1건만 후보로 사용
        Set<String> seenTitles = new HashSet<>();
        List<LatestInfo> candidates = infoRepository.findTop60ByOrderByCreatedAtDesc().stream()
                .filter(e -> seenTitles.add(e.getTitle()))
                .toList();
        if (candidates.isEmpty()) {
            return new RecommendedInfoResponse(member.getNickname(), desiredJob, List.of());
        }

        List<Pick> picks = pick(desiredJob, candidates);
        Map<Long, LatestInfo> byId = candidates.stream()
                .collect(Collectors.toMap(LatestInfo::getId, Function.identity()));
        List<RecommendedInfoDto> items = picks.stream()
                .filter(p -> byId.containsKey(p.id()))
                .map(p -> RecommendedInfoDto.from(byId.get(p.id()), p.reason()))
                .toList();
        return new RecommendedInfoResponse(member.getNickname(), desiredJob, items);
    }

    private List<Pick> pick(String desiredJob, List<LatestInfo> candidates) {
        String key = desiredJob + "|" + candidates.get(0).getId();
        CachedPicks cached = cache.get(key);
        if (cached != null && cached.date().equals(LocalDate.now())) {
            return cached.picks();
        }

        try {
            List<Pick> picks = requestAi(desiredJob, candidates);
            if (!picks.isEmpty()) {
                cache.put(key, new CachedPicks(LocalDate.now(), picks));
                return picks;
            }
        } catch (Exception e) {
            log.warn("맞춤 소식 AI 추천 실패 — 키워드 매칭으로 대체: {}", e.getMessage());
        }
        return keywordFallback(desiredJob, candidates);
    }

    private List<Pick> requestAi(String desiredJob, List<LatestInfo> candidates) throws Exception {
        List<Map<String, Object>> articles = candidates.stream()
                .map(e -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", e.getId());
                    m.put("title", e.getTitle());
                    m.put("sub_title", e.getSubTitle());
                    m.put("category", e.getCategory());
                    return m;
                })
                .toList();
        Map<String, Object> body = Map.of("desired_job", desiredJob, "articles", articles, "limit", LIMIT);

        String json = restTemplate.postForObject(aiServerUrl + "/api/latest-info/recommend", body, String.class);
        JsonNode res = json != null ? objectMapper.readTree(json) : null;
        List<Pick> picks = new ArrayList<>();
        if (res != null && res.has("items")) {
            for (JsonNode item : res.get("items")) {
                picks.add(new Pick(item.path("id").asLong(), item.path("reason").asText("")));
            }
        }
        return picks;
    }

    /** AI 서버 장애 시: 희망직무 단어가 제목/부제/카테고리에 많이 등장하는 순, 동점이면 최신순. */
    private List<Pick> keywordFallback(String desiredJob, List<LatestInfo> candidates) {
        List<String> tokens = Arrays.stream(desiredJob.split("[\\s,/·]+"))
                .filter(t -> t.length() >= 2)
                .toList();

        record Scored(LatestInfo info, int score, String token) {}
        List<Scored> scored = new ArrayList<>();
        for (LatestInfo info : candidates) {
            String text = String.join(" ", Objects.toString(info.getTitle(), ""),
                    Objects.toString(info.getSubTitle(), ""), Objects.toString(info.getCategory(), ""));
            int score = 0;
            String hit = null;
            for (String t : tokens) {
                if (text.contains(t)) {
                    score++;
                    if (hit == null) hit = t;
                }
            }
            scored.add(new Scored(info, score, hit));
        }

        // 후보는 이미 최신순이므로 stable sort로 점수만 정렬
        scored.sort(Comparator.comparingInt(Scored::score).reversed());
        return scored.stream()
                .limit(LIMIT)
                .map(s -> new Pick(s.info().getId(), s.token() != null
                        ? "'" + s.token() + "' 관련 소식이에요"
                        : "최근 주목받는 취업 소식이에요"))
                .toList();
    }
}
