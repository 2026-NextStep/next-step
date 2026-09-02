package com.nextstep.backend.contract.util;

/**
 * 4대보험 + 소득세 공제 및 실수령액 계산 유틸.
 * 2025년 근로자 부담분 기준.
 *
 * 요율(2025년):
 *   국민연금:      4.5%
 *   건강보험:      3.545%
 *   장기요양보험:  건강보험료의 12.95%
 *   고용보험:      0.9%
 *
 * 소득세는 간이세액표 구간 근사식 사용 (부양가족 1인·본인 기준, 비과세 0원 가정).
 * 실제 원천징수액과 ±수만원 차이 가능.
 */
public final class SalaryCalculator {

    private static final double NATIONAL_PENSION_RATE    = 0.045;
    private static final double HEALTH_INSURANCE_RATE    = 0.03545;
    private static final double LONG_TERM_CARE_RATE      = 0.1295;  // 건강보험료 대비
    private static final double EMPLOYMENT_INSURANCE_RATE = 0.009;

    private SalaryCalculator() {}

    public static class Result {
        public final long grossSalary;
        public final long nationalPension;
        public final long healthInsurance;
        public final long longTermCareInsurance;
        public final long employmentInsurance;
        public final long incomeTax;
        public final long localIncomeTax;
        public final long netSalary;

        Result(long gross, long np, long hi, long ltc, long ei, long it, long lit, long net) {
            this.grossSalary            = gross;
            this.nationalPension        = np;
            this.healthInsurance        = hi;
            this.longTermCareInsurance  = ltc;
            this.employmentInsurance    = ei;
            this.incomeTax              = it;
            this.localIncomeTax         = lit;
            this.netSalary              = net;
        }
    }

    /**
     * 세전 월급 기준으로 공제 항목과 실수령액을 계산.
     * gross가 null 또는 0 이하이면 모든 항목 0인 Result 반환.
     */
    public static Result calculate(Long gross) {
        if (gross == null || gross <= 0) {
            return new Result(0, 0, 0, 0, 0, 0, 0, 0);
        }

        long nationalPension      = Math.round(gross * NATIONAL_PENSION_RATE);
        long healthInsurance      = Math.round(gross * HEALTH_INSURANCE_RATE);
        long longTermCare         = Math.round(healthInsurance * LONG_TERM_CARE_RATE);
        long employmentInsurance  = Math.round(gross * EMPLOYMENT_INSURANCE_RATE);
        long incomeTax            = estimateIncomeTax(gross);
        long localIncomeTax       = Math.round(incomeTax * 0.1);

        long netSalary = gross
                - nationalPension
                - healthInsurance
                - longTermCare
                - employmentInsurance
                - incomeTax
                - localIncomeTax;

        return new Result(
                gross,
                nationalPension,
                healthInsurance,
                longTermCare,
                employmentInsurance,
                incomeTax,
                localIncomeTax,
                Math.max(netSalary, 0)
        );
    }

    /**
     * 소득세 간이세액표 구간 근사식 (부양가족 1인 본인 기준).
     */
    private static long estimateIncomeTax(long gross) {
        if (gross < 1_060_000)  return 0;
        if (gross < 1_500_000)  return Math.round((gross - 1_060_000) * 0.06);
        if (gross < 2_000_000)  return Math.round(26_400 + (gross - 1_500_000) * 0.10);
        if (gross < 2_500_000)  return Math.round(76_400 + (gross - 2_000_000) * 0.13);
        if (gross < 3_000_000)  return Math.round(141_400 + (gross - 2_500_000) * 0.15);
        if (gross < 3_500_000)  return Math.round(216_400 + (gross - 3_000_000) * 0.17);
        if (gross < 4_500_000)  return Math.round(301_400 + (gross - 3_500_000) * 0.19);
        if (gross < 6_000_000)  return Math.round(491_400 + (gross - 4_500_000) * 0.21);
        if (gross < 8_500_000)  return Math.round(806_400 + (gross - 6_000_000) * 0.24);
        return Math.round(1_406_400 + (gross - 8_500_000) * 0.30);
    }
}