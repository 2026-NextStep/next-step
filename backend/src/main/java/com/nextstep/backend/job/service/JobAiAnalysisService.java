package com.nextstep.backend.job.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.nextstep.backend.job.dto.JobPostingDetailDto;
import com.nextstep.backend.job.entity.JobAiAnalysis;
import com.nextstep.backend.job.repository.JobAiAnalysisRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class JobAiAnalysisService {

    private final JobAiAnalysisRepository repository;
    private final JobPostingService jobPostingService;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy.MM.dd");

    @Value("${ai.server.url:http://localhost:8000}")
    private String aiServerUrl;

    public JobAiAnalysisService(JobAiAnalysisRepository repository,
                                JobPostingService jobPostingService) {
        this.repository = repository;
        this.jobPostingService = jobPostingService;
        this.restTemplate = new RestTemplate();
    }

    public String getOrCreate(Long jobId) {
        Optional<JobAiAnalysis> cached = repository.findByPostingId(jobId);
        if (cached.isPresent()) {
            return reconstruct(cached.get());
        }

        JobPostingDetailDto jobDetail = jobPostingService.getJobDetail(jobId);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(Map.of("job", jobDetail), headers);

        String analysisJson;
        try {
            analysisJson = restTemplate.postForObject(aiServerUrl + "/api/job/analyze", request, String.class);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI 서버 호출 실패: " + e.getMessage());
        }

        if (analysisJson == null) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI 서버에서 빈 응답을 반환했습니다.");
        }

        try {
            JsonNode root = objectMapper.readTree(analysisJson);

            ObjectNode keyInfo = objectMapper.createObjectNode();
            keyInfo.put("coreSummary",   textOf(root, "coreSummary"));
            keyInfo.put("companySub",    textOf(root, "companySub"));
            keyInfo.put("positionTitle", textOf(root, "positionTitle"));
            keyInfo.put("positionSub",   textOf(root, "positionSub"));
            keyInfo.put("locationSub",   textOf(root, "locationSub"));
            keyInfo.put("deadlineSub",   textOf(root, "deadlineSub"));

            ObjectNode checklist = objectMapper.createObjectNode();
            checklist.set("checklist",   nodeOf(root, "checklist"));
            checklist.put("warningText", textOf(root, "warningText"));

            JobAiAnalysis entity = new JobAiAnalysis();
            entity.setPostingId(jobId);
            entity.setCompanyName(truncate(jobDetail.getOrg(), 100));
            entity.setJobTitle(truncate(jobDetail.getTitle(), 200));
            entity.setRegion(truncate(jobDetail.getWorkLocation(), 200));
            entity.setStartDate(parseDate(jobDetail.getStart()));
            entity.setEndDate(parseDate(jobDetail.getEnd()));
            entity.setOverview(objectMapper.writeValueAsString(nodeOf(root, "summary")));
            entity.setKeyInfo(objectMapper.writeValueAsString(keyInfo));
            entity.setQualificationChecklist(objectMapper.writeValueAsString(checklist));
            entity.setPreferenceScore(objectMapper.writeValueAsString(nodeOf(root, "bonuses")));
            entity.setSelectionProcess(objectMapper.writeValueAsString(nodeOf(root, "steps")));
            entity.setCreatedAt(LocalDateTime.now());
            repository.save(entity);

        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "AI 응답 파싱 실패: " + e.getMessage());
        }

        return analysisJson;
    }

    @org.springframework.transaction.annotation.Transactional
    public void saveForMember(Long postingId, Long memberId) {
        // 해당 공고 AI 분석이 DB에 없으면 먼저 생성
        repository.findByPostingId(postingId).orElseGet(() -> {
            getOrCreate(postingId);
            return repository.findByPostingId(postingId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "AI 분석 데이터 생성 실패"));
        });
        // 기존 row에 memberId 업데이트 (row는 postingId당 1개 유지)
        repository.updateMemberIdByPostingId(postingId, memberId);
    }

    public List<Map<String, Object>> getByMember(Long memberId) {
        return repository.findByMemberIdOrderByCreatedAtDesc(memberId).stream().map(e -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("postingId", e.getPostingId());
            m.put("companyName", e.getCompanyName());
            m.put("title", e.getJobTitle());
            if (e.getEndDate() != null) {
                long dDay = ChronoUnit.DAYS.between(LocalDate.now(), e.getEndDate());
                m.put("dDay", dDay);
                m.put("isAlwaysRecruiting", false);
            } else {
                m.put("dDay", null);
                m.put("isAlwaysRecruiting", true);
            }
            m.put("location", e.getRegion());
            m.put("careerLevel", null);
            m.put("employmentType", null);
            return m;
        }).collect(Collectors.toList());
    }

    private String reconstruct(JobAiAnalysis entity) {
        try {
            ObjectNode result = objectMapper.createObjectNode();

            result.set("summary", objectMapper.readTree(nullSafe(entity.getOverview(), "[]")));

            JsonNode keyInfo = objectMapper.readTree(nullSafe(entity.getKeyInfo(), "{}"));
            result.put("coreSummary",   keyInfo.path("coreSummary").asText(""));
            result.put("companySub",    keyInfo.path("companySub").asText(""));
            result.put("positionTitle", keyInfo.path("positionTitle").asText(""));
            result.put("positionSub",   keyInfo.path("positionSub").asText(""));
            result.put("locationSub",   keyInfo.path("locationSub").asText(""));
            result.put("deadlineSub",   keyInfo.path("deadlineSub").asText(""));

            JsonNode cl = objectMapper.readTree(nullSafe(entity.getQualificationChecklist(), "{}"));
            result.set("checklist",   cl.path("checklist").isMissingNode() ? objectMapper.createArrayNode() : cl.get("checklist"));
            result.put("warningText", cl.path("warningText").asText(""));

            result.set("bonuses", objectMapper.readTree(nullSafe(entity.getPreferenceScore(), "[]")));
            result.set("steps", objectMapper.readTree(nullSafe(entity.getSelectionProcess(), "[]")));

            return objectMapper.writeValueAsString(result);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "DB 데이터 재조립 실패: " + e.getMessage());
        }
    }

    private String textOf(JsonNode node, String field) {
        return node.path(field).asText("");
    }

    private JsonNode nodeOf(JsonNode node, String field) {
        JsonNode child = node.path(field);
        return child.isMissingNode() ? objectMapper.createArrayNode() : child;
    }

    private String nullSafe(String value, String fallback) {
        return (value == null || value.isBlank()) ? fallback : value;
    }

    private LocalDate parseDate(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) return null;
        try { return LocalDate.parse(dateStr, DATE_FMT); } catch (Exception e) { return null; }
    }

    private String truncate(String value, int max) {
        if (value == null) return null;
        return value.length() > max ? value.substring(0, max) : value;
    }
}
