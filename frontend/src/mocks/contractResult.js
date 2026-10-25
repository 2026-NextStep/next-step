export const mockContractAnalysis = {
  id: 1,
  fileName: '스타트업 마케팅 인턴 근로계약서',
  uploadedAt: '2025.03.08',
  totalPages: 4,
  overallRiskLevel: 'MEDIUM',
  riskItemCount: 3,
  highRiskCount: 1,
  mediumRiskCount: 2,
  checkItemCount: 5,
  checkItemNote: '휴게시간 · 연장근로 등',
  contractSummary: '1년 계약',
  contractSummaryNote: '주 40시간 · 수습 3개월',
  riskItems: [
    {
      id: 1,
      title: '포괄임금제 관련 문구가 모호합니다',
      level: 'HIGH',
      description:
        '계약서에 "연장 · 야간 · 휴일근로 수당은 월 급여에 포함한다"는 문구가 있으나, 포함 범위와 시간 산정 기준이 명확하지 않습니다. 실제 초과근로가 발생할 경우 수당 분쟁으로 이어질 가능성이 있습니다.',
      reason:
        '근로시간과 수당 산정 기준이 빠진 포괄임금 약정은 무효 또는 분쟁 소지가 생길 수 있습니다. 월 몇 시간의 연장근로가 포함되는지, 초과 시 별도 지급되는지 확인이 필요합니다.',
      recommendation: '',
    },
    {
      id: 2,
      title: '휴게시간 기재가 구체적이지 않습니다',
      level: 'MEDIUM',
      description:
        '근무시간은 오전 9시부터 오후 6시로 적혀 있지만, 휴게시간이 "회사 사정에 따른다"고만 기재되어 있어 실제 휴식 시간이 보장되는지 판단하기 어렵습니다.',
      reason: '',
      recommendation:
        '점심시간과 휴게시간의 시작 · 종료 시각을 명시해 달라고 요청하는 것이 좋습니다.',
    },
    {
      id: 3,
      title: '수습기간 중 급여 감액 기준이 불명확합니다',
      level: 'MEDIUM',
      description:
        '수습 3개월 조항은 있으나, 수습기간 중 급여를 얼마까지 감액하는지와 감액 사유가 구체적으로 적혀 있지 않습니다. 사회초년생에게 불리하게 적용할 수 있습니다.',
      reason: '',
      recommendation:
        '수습기간 적용 임금, 평가 방식, 정식 채용 전환 기준을 서면으로 요청해 두면 안전합니다.',
    },
  ],
  salaryBreakdown: {
    grossSalary: 2500000,
    nationalPension: -112500,
    healthInsurance: -88750,
    longTermCareInsurance: -11490,
    employmentInsurance: -22500,
    netSalary: 2284530,
  },
  basicInfo: {
    companyName: '오렌지웨이브',
    position: '마케팅 인턴',
    contractPeriod: '2025.03.15 ~ 2026.03.14',
    workingHours: '주 40시간 · 09:00 ~ 18:00',
    probationPeriod: '3개월',
    salary: '월 250만원',
  },
  precautions: [
    {
      title: '구두 설명만 믿지 말고 서면본을 받으세요',
      description:
        '담당자가 구두로 설명한 내용이 있다면 계약서에 직접 반영되었는지 확인하세요.',
    },
    {
      title: '포괄임금제, 수습, 휴게시간은 꼭 질문하세요',
      description:
        '가장 자주 분쟁이 발생하는 항목들입니다. 모호한 문구는 구체적으로 수정 요청하는 것이 좋습니다.',
    },
    {
      title: '사인 전 계약서 사본을 저장하세요',
      description:
        'PDF 원본과 분석 결과를 함께 저장해 두면 이후 문제 발생 시 도움이 됩니다.',
    },
  ],
  questionsForRecruiter: [
    '포괄임금에 포함되는 연장근로 시간이 월 몇 시간인지 명확히 안내해 주실 수 있나요?',
    '수습기간 중 급여와 정규 전환 기준은 어떻게 적용되나요?',
    '점심시간과 휴게시간은 실제로 몇 시부터 몇 시까지 보장되나요?',
    '주말 · 야간 근무 발생 시 추가 수당은 별도로 지급되나요?',
  ],
}