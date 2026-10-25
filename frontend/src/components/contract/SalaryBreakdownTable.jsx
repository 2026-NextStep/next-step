const ROWS = [
  { key: 'grossSalary',           label: '세전 월급',    negative: false },
  { key: 'nationalPension',       label: '국민연금',     negative: true  },
  { key: 'healthInsurance',       label: '건강보험',     negative: true  },
  { key: 'longTermCareInsurance', label: '장기요양보험', negative: true  },
  { key: 'employmentInsurance',   label: '고용보험',     negative: true  },
  { key: 'incomeTax',             label: '소득세',       negative: true  },
  { key: 'localIncomeTax',        label: '지방소득세',   negative: true  },
]

export default function SalaryBreakdownTable({ data }) {
  const netSalary = data?.netSalary ?? null

  return (
    <div>
      {/* 월 실수령액 — 전폭, 줄바꿈 없이 */}
      <div className="mb-6">
        <p className="text-xs text-gray-400 mb-1">예상 월 실수령액</p>
        <p className="text-3xl font-bold text-gray-900 tabular-nums whitespace-nowrap">
          {netSalary != null ? netSalary.toLocaleString() : '정보 없음'}원
        </p>
      </div>

      {/* 항목별 내역 */}
      <div className="space-y-3">
        {ROWS.map(({ key, label, negative }) => {
          const value = data?.[key] ?? 0
          return (
            <div key={key} className="flex items-center justify-between text-sm">
              <span className="text-gray-500">{label}</span>
              <span className={`tabular-nums ${negative ? 'text-red-500' : 'text-gray-800'}`}>
                {negative ? '-' : ''}
                {Math.abs(value).toLocaleString()}원
              </span>
            </div>
          )
        })}
      </div>

      {/* 합계 */}
      <div className="mt-5 pt-5 border-t border-gray-200 flex items-center justify-between">
        <span className="text-sm text-gray-500">예상 실수령액</span>
        <span className="text-xl font-bold text-blue-600 tabular-nums whitespace-nowrap">
          {netSalary != null ? netSalary.toLocaleString() : '정보 없음'}원
        </span>
      </div>

      {/* 안내 문구 — 하단 */}
      <div className="mt-4 space-y-1.5">
        <p className="text-xs text-gray-400 leading-relaxed">
          ※ 2025년 4대보험 요율 + 소득세 간이세액표 근사값 기준입니다.
          부양가족·비과세 항목에 따라 실제 원천징수액과 차이가 있을 수 있습니다.
        </p>
        <p className="text-xs text-gray-400 leading-relaxed">
          ※ 4대보험 전체 가입 정규직 기준 계산입니다.
          주 15시간 미만 단시간 근로자·3.3% 사업소득·일용직 등은 공제 항목이 다를 수 있습니다.
        </p>
      </div>
    </div>
  )
}