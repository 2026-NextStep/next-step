package com.nextstep.backend.job.spec;

import com.nextstep.backend.job.entity.JobPosting;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.util.Arrays;

public class JobPostingSpec {

    private static final Specification<JobPosting> ALL = (root, query, cb) -> cb.conjunction();

    /**
     * 공백으로 구분된 각 토큰이 제목/기관명/채용분야 중 하나에는 포함되도록 AND 매칭.
     * "정규직 연구원" 검색 시 두 단어가 붙어있지 않아도(예: "정규직 직원(연구책임자) 채용") 매칭되도록 함.
     */
    public static Specification<JobPosting> searchKeyword(String keyword) {
        if (keyword == null || keyword.isBlank()) return ALL;
        String[] tokens = keyword.trim().split("\\s+");
        return (root, query, cb) -> {
            Predicate[] tokenPredicates = Arrays.stream(tokens)
                .map(token -> {
                    String like = "%" + token + "%";
                    return cb.or(
                        cb.like(root.get("jobTitle"), like),
                        cb.like(root.get("companyName"), like),
                        cb.like(root.get("recruitField"), like)
                    );
                })
                .toArray(Predicate[]::new);
            return cb.and(tokenPredicates);
        };
    }

    public static Specification<JobPosting> employmentType(String employment) {
        if (employment == null || employment.isBlank()) return ALL;
        return (root, query, cb) -> cb.or(
            cb.equal(root.get("employmentType"), employment),
            cb.like(root.get("employmentType"), employment + ",%"),
            cb.like(root.get("employmentType"), "%," + employment + ",%"),
            cb.like(root.get("employmentType"), "%," + employment)
        );
    }

    public static Specification<JobPosting> workLocation(String region) {
        if (region == null || region.isBlank()) return ALL;
        return (root, query, cb) -> cb.or(
            cb.equal(root.get("workLocation"), region),
            cb.like(root.get("workLocation"), region + ",%"),
            cb.like(root.get("workLocation"), "%," + region + ",%"),
            cb.like(root.get("workLocation"), "%," + region)
        );
    }

    public static Specification<JobPosting> statusFilter(String status) {
        if (status == null || status.isBlank()) return ALL;
        return (root, query, cb) -> cb.equal(root.get("status"), status);
    }

    /**
     * 이미 마감일이 지난 공고는 기본 목록에서 제외.
     * 사용자가 명시적으로 "마감" 상태를 선택한 경우에는 그대로 노출.
     * 동기화 주기 특성상 마감된 공고가 정리되지 않고 쌓일 수 있어,
     * 이 필터가 없으면 "마감일순" 정렬 시 이미 끝난 공고가 상위에 몰리게 됨.
     */
    public static Specification<JobPosting> excludeExpiredUnless(String status) {
        if ("마감".equals(status)) return ALL;
        LocalDate today = LocalDate.now();
        return (root, query, cb) -> cb.or(
            cb.isNull(root.get("endDate")),
            cb.greaterThanOrEqualTo(root.get("endDate"), today)
        );
    }

    public static Specification<JobPosting> quickFilter(String filter) {
        if (filter == null || filter.isBlank()) return ALL;
        LocalDate today = LocalDate.now();
        return switch (filter) {
            case "신입 채용" -> (root, query, cb) -> cb.or(
                cb.like(root.get("jobTitle"), "%신입%"),
                cb.like(root.get("recruitField"), "%신입%")
            );
            case "체험형 인턴" -> (root, query, cb) -> cb.or(
                cb.like(root.get("employmentType"), "%인턴%"),
                cb.like(root.get("jobTitle"), "%인턴%")
            );
            case "정규직" -> (root, query, cb) -> cb.like(root.get("employmentType"), "%정규직%");
            case "오늘 마감" -> (root, query, cb) -> cb.equal(root.get("endDate"), today);
            case "D-7 이내" -> (root, query, cb) -> cb.and(
                cb.greaterThanOrEqualTo(root.get("endDate"), today),
                cb.lessThanOrEqualTo(root.get("endDate"), today.plusDays(7))
            );
            default -> ALL;
        };
    }
}
