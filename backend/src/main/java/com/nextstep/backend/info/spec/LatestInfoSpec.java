package com.nextstep.backend.info.spec;

import com.nextstep.backend.info.entity.LatestInfo;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;

public class LatestInfoSpec {

    private static final Specification<LatestInfo> ALL = (root, query, cb) -> cb.conjunction();
    private static final DateTimeFormatter MONTH_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM");

    public static Specification<LatestInfo> category(String category) {
        if (category == null || category.isBlank()) return ALL;
        return (root, query, cb) -> cb.equal(root.get("category"), category);
    }

    /** month는 "yyyy-MM" 형식(예: 2026-09). 해당 월 1일 00:00 ~ 다음달 1일 00:00 사이만 조회. */
    public static Specification<LatestInfo> month(String month) {
        if (month == null || month.isBlank()) return ALL;
        YearMonth yearMonth;
        try {
            yearMonth = YearMonth.parse(month, MONTH_FORMAT);
        } catch (Exception e) {
            return ALL;
        }
        LocalDateTime from = yearMonth.atDay(1).atStartOfDay();
        LocalDateTime to = yearMonth.plusMonths(1).atDay(1).atStartOfDay();
        return (root, query, cb) -> cb.and(
            cb.greaterThanOrEqualTo(root.get("createdAt"), from),
            cb.lessThan(root.get("createdAt"), to)
        );
    }
}
