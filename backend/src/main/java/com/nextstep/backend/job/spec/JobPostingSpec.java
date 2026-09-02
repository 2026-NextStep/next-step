package com.nextstep.backend.job.spec;

import com.nextstep.backend.job.entity.JobPosting;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;

public class JobPostingSpec {

    private static final Specification<JobPosting> ALL = (root, query, cb) -> cb.conjunction();

    public static Specification<JobPosting> searchKeyword(String keyword) {
        if (keyword == null || keyword.isBlank()) return ALL;
        String like = "%" + keyword.trim() + "%";
        return (root, query, cb) -> cb.or(
            cb.like(root.get("jobTitle"), like),
            cb.like(root.get("companyName"), like),
            cb.like(root.get("recruitField"), like)
        );
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
