import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useBlocker } from 'react-router-dom'
import { Loader2, Copy, Check, Download } from 'lucide-react'
import { getContractAnalysis, deleteContract } from '../api/contract'
import RiskItemCard from '../components/contract/RiskItemCard'
import SummaryCard from '../components/contract/SummaryCard'
import SalaryBreakdownTable from '../components/contract/SalaryBreakdownTable'
import ConfirmModal from '../components/common/ConfirmModal'

/* ── 종합 위험도 설정 ─────────────────────────────── */
const RISK_CONFIG = {
  HIGH: {
    label: '상',
    text: 'text-red-500',
    card: 'bg-red-50 border-red-200',
    desc: '즉시 전문가 상담 또는 계약 재검토가 필요합니다.',
  },
  MEDIUM: {
    label: '중',
    text: 'text-amber-500',
    card: 'bg-amber-50 border-amber-200',
    desc: '즉시 서명하기보다는 수정 요청 또는 추가 확인이 필요한 계약서입니다.',
  },
  LOW: {
    label: '하',
    text: 'text-green-500',
    card: 'bg-green-50 border-green-200',
    desc: '비교적 안전한 계약서입니다. 몇 가지 항목만 확인하면 됩니다.',
  },
}

/* ── 공통 섹션 헤더 ──────────────────────────────── */
function SectionHeader({ icon, title, right }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-sm font-bold text-gray-900">{title}</h2>
      </div>
      {right}
    </div>
  )
}

/* ── 질문 복사 버튼 ──────────────────────────────── */
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label="복사"
      className="shrink-0 p-1 rounded text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors"
    >
      {copied
        ? <Check size={13} className="text-green-500" />
        : <Copy size={13} />
      }
    </button>
  )
}

/* ── 메인 컴포넌트 ───────────────────────────────── */
export default function ContractResultPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)
  const [showPdfGuideModal, setShowPdfGuideModal] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)
  const isLeavingRef = useRef(false)
  const [hasPdfSaved, setHasPdfSaved] = useState(false)

  const shouldWarnBeforeLeave = !loading && !notFound && data && !isLeaving

  useEffect(() => {
    if (!id) return
    const controller = new AbortController()
    setLoading(true)
    setNotFound(false)
    getContractAnalysis(id, controller.signal)
      .then((response) => {
        setData(response)
        setLoading(false)
      })
      .catch((error) => {
        if (error.name === 'CanceledError' || error.name === 'AbortError') return
        setNotFound(true)
        setLoading(false)
      })
    return () => controller.abort()
  }, [id])

  useEffect(() => {
    if (!shouldWarnBeforeLeave) return
    const handleBeforeUnload = (e) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [shouldWarnBeforeLeave])

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      shouldWarnBeforeLeave &&
      !isLeavingRef.current &&
      currentLocation.pathname !== nextLocation.pathname
  )

  useEffect(() => {
    if (blocker.state === 'blocked') {
      setPendingAction('navigate')
      setShowLeaveModal(true)
    }
  }, [blocker.state])

  const performReupload = async () => {
    setIsDeleting(true)
    try {
      await deleteContract(id)
    } catch (error) {
      console.error('계약서 삭제 실패:', error)
    } finally {
      isLeavingRef.current = true
      setIsLeaving(true)
      setShowLeaveModal(false)
      setIsDeleting(false)
      navigate('/contract/upload')
    }
  }

  const handleReupload = () => {
    if (shouldWarnBeforeLeave) {
      setPendingAction('reupload')
      setShowLeaveModal(true)
    } else {
      performReupload()
    }
  }

  const handleConfirmLeave = async () => {
    if (pendingAction === 'reupload') {
      await performReupload()
    } else if (pendingAction === 'navigate' && blocker.state === 'blocked') {
      setIsDeleting(true)
      try {
        await deleteContract(id)
      } catch (error) {
        console.error('계약서 삭제 실패:', error)
      }
      isLeavingRef.current = true
      setIsLeaving(true)
      setShowLeaveModal(false)
      setIsDeleting(false)
      blocker.proceed()
    }
    setPendingAction(null)
  }

  const handleCancelLeave = () => {
    setShowLeaveModal(false)
    if (pendingAction === 'navigate' && blocker.state === 'blocked') {
      blocker.reset()
    }
    setPendingAction(null)
  }

  const handlePdfSaveClick = () => {
    setShowPdfGuideModal(true)
  }

  const handlePdfGuideConfirm = () => {
    setShowPdfGuideModal(false)
    setTimeout(() => {
      window.print()
      setHasPdfSaved(true)
    }, 100)
  }

  /* ── 로딩 ── */
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-gray-50">
        <Loader2 size={32} className="text-blue-400 animate-spin" />
        <p className="text-sm text-gray-400">분석 결과를 불러오는 중...</p>
      </div>
    )
  }

  /* ── Not Found ── */
  if (notFound || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-5 bg-gray-50">
        <div className="text-center">
          <p className="text-base font-semibold text-gray-800 mb-1">분석 결과를 찾을 수 없습니다</p>
          <p className="text-sm text-gray-400">요청하신 계약서 분석 결과가 존재하지 않습니다.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/contract/upload')}
          className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          다시 업로드하기
        </button>
      </div>
    )
  }

  const leaveModalTitle = hasPdfSaved
    ? '이 페이지를 떠나시겠어요?'
    : '분석 결과를 저장하지 않으셨어요'

  const leaveModalMessage = hasPdfSaved
    ? 'PDF는 저장되었습니다.\n이 페이지를 벗어나면 서버의 분석 결과는\n즉시 삭제됩니다.'
    : '이 페이지를 벗어나면 분석 결과가\n영구적으로 삭제됩니다.\n\n결과를 보관하시려면 "PDF로 저장"을\n먼저 진행해 주세요.'

  const risk = RISK_CONFIG[data.overallRiskLevel] ?? RISK_CONFIG.MEDIUM

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-[980px] mx-auto px-4 py-6">

        {/* ── 액션 바 ─────────────────────────────── */}
        <div className="flex items-center justify-between mb-6 print:hidden">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
            aria-label="뒤로"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleReupload}
              disabled={isDeleting}
              className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              다시 업로드
            </button>
            <button
              type="button"
              onClick={handlePdfSaveClick}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <Download size={14} />
              PDF로 저장
            </button>
          </div>
        </div>

        {/* ── 2단 그리드 ──────────────────────────── */}
        <div className="grid grid-cols-[1fr_340px] gap-5 items-start print:grid-cols-1 print:gap-4">

          {/* ════ 좌측 메인 ══════════════════════════ */}
          <div className="space-y-5">

            {/* 제목 + 요약 통계 */}
            <div className="bg-white rounded-2xl shadow-sm p-7">
              <span className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-medium mb-3">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                AI 근로계약서 분석 결과
              </span>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{data.fileName ?? '파일명 없음'}</h1>
              <p className="text-xs text-gray-400 leading-relaxed">
                OCR 추출 완료 · {data.uploadedAt ?? ''} 업로드 · 총 {data.totalPages ?? 0}페이지 분석 · 표준계약서 대비 누락 및 위험 요소를 함께 점검했습니다.
              </p>

              {/* 요약 통계 — 숫자 카드 3열 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-5 border-t border-gray-100">
                <SummaryCard
                  label="탐지된 문제 조항 수"
                  value={`${data.riskItemCount ?? 0}개`}
                  note={`고위험 ${data.highRiskCount ?? 0} · 중간위험 ${data.mediumRiskCount ?? 0}`}
                />
                <SummaryCard
                  label="예상 월 실수령액"
                  value={data.salaryBreakdown?.netSalary != null ? `${data.salaryBreakdown.netSalary.toLocaleString()}원` : '정보 없음'}
                  note={data.salaryBreakdown?.grossSalary != null ? `세전 ${(data.salaryBreakdown.grossSalary / 10000).toLocaleString()}만원 기준` : ''}
                />
                <SummaryCard
                  label="확인 필요 항목"
                  value={`${data.checkItemCount ?? 0}개`}
                  note={data.checkItemNote ?? ''}
                />
              </div>

              {/* 계약 핵심 요약 — 전폭 */}
              {data.contractSummary && (
                <div className="mt-4 bg-gray-50 rounded-xl px-5 py-4">
                  <p className="text-xs text-gray-400 mb-1.5">계약 핵심 요약</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{data.contractSummary}</p>
                </div>
              )}
            </div>

            {/* 독소조항 */}
            <div className="bg-white rounded-2xl shadow-sm p-7">
              <SectionHeader
                icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12" y2="17" />
                  </svg>
                }
                title="독소조항 및 문제 설명"
                right={<span className="text-xs text-gray-400">클릭하면 자세히 볼 수 있습니다</span>}
              />
              <div className="space-y-4">
                {(data.riskItems?.length ?? 0) > 0
                  ? data.riskItems.map((item) => (
                      <RiskItemCard key={item.id} item={item} />
                    ))
                  : (
                    <div className="rounded-xl bg-gray-50 border border-gray-100 px-5 py-4">
                      <p className="text-sm font-medium text-gray-700">특별히 우려되는 조항이 발견되지 않았습니다.</p>
                      <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                        AI 분석은 참고용이며, 중요한 결정 전에는 노무사·고용노동부 등 전문기관 상담을 권장합니다.
                      </p>
                    </div>
                  )}
              </div>
            </div>

            {/* 실수령액 계산 */}
            <div className="bg-white rounded-2xl shadow-sm p-7">
              <SectionHeader
                icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                  </svg>
                }
                title="실수령액 계산"
                right={
                  <span className="text-xs font-medium text-blue-500 bg-blue-50 px-2.5 py-0.5 rounded-full">
                    예상치
                  </span>
                }
              />
              {data.salaryBreakdown
                ? <SalaryBreakdownTable data={data.salaryBreakdown} />
                : <p className="text-xs text-gray-400">급여 정보가 없습니다.</p>}
            </div>
          </div>

          {/* ════ 우측 사이드바 ══════════════════════ */}
          <div className="space-y-4">

            {/* 종합 위험도 */}
            <div className={`${risk.card} rounded-2xl border p-6`}>
              <p className="text-xs font-medium text-gray-500 mb-2">종합 위험도</p>
              <p className={`text-3xl font-bold ${risk.text} mb-3`}>{risk.label}</p>
              <p className="text-xs text-gray-600 leading-relaxed">{risk.desc}</p>
            </div>

            {/* 계약 기본 정보 */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <SectionHeader
                icon={
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                }
                title="계약 기본 정보"
              />
              {data.basicInfo
                ? (
                  <dl className="space-y-3">
                    {[
                      ['회사명', data.basicInfo.companyName || '정보 없음'],
                      ['사업주', data.basicInfo.employerName || '정보 없음'],
                      ['직무', data.basicInfo.position || '정보 없음'],
                      ['계약기간', data.basicInfo.contractPeriod || '정보 없음'],
                      ['근무시간', data.basicInfo.workingHours || '정보 없음'],
                      ['수습기간', data.basicInfo.probationPeriod || '없음'],
                      ['급여', data.basicInfo.salary || '정보 없음'],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between gap-4 text-xs">
                        <dt className="text-gray-400 shrink-0">{label}</dt>
                        <dd className="font-medium text-gray-800 text-right">{value}</dd>
                      </div>
                    ))}
                  </dl>
                )
                : <p className="text-xs text-gray-400">계약 기본 정보가 없습니다.</p>}
            </div>

            {/* 서명 전 주의사항 */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <SectionHeader
                icon={
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <line x1="12" y1="17" x2="12" y2="17" />
                  </svg>
                }
                title="서명 전 주의사항"
              />
              <div className="space-y-4">
                {(data.precautions?.length ?? 0) > 0
                  ? data.precautions.map((p, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <svg className="shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                          <line x1="12" y1="17" x2="12" y2="17" />
                        </svg>
                        <div>
                          <p className="text-xs font-semibold text-gray-800 mb-0.5">{p.title}</p>
                          <p className="text-xs text-gray-500 leading-relaxed">{p.description}</p>
                        </div>
                      </div>
                    ))
                  : <p className="text-xs text-gray-400">주의사항 정보가 없습니다.</p>}
              </div>
            </div>

            {/* 채용 담당자에게 물어볼 질문 */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <SectionHeader
                icon={
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                }
                title="채용 담당자에게 물어볼 질문"
              />
              <div className="space-y-3">
                {(data.questionsForRecruiter?.length ?? 0) > 0
                  ? data.questionsForRecruiter.map((q, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 pb-3 border-b border-gray-50 last:border-0 last:pb-0"
                      >
                        <p className="flex-1 text-xs text-gray-600 leading-relaxed">{q}</p>
                        <CopyButton text={q} />
                      </div>
                    ))
                  : <p className="text-xs text-gray-400">추천 질문이 없습니다.</p>}
              </div>
            </div>
          </div>
        </div>

        <ConfirmModal
          isOpen={showLeaveModal}
          title={leaveModalTitle}
          message={leaveModalMessage}
          confirmText="나가기"
          cancelText="취소"
          onConfirm={handleConfirmLeave}
          onCancel={handleCancelLeave}
          variant="warning"
          isLoading={isDeleting}
        />

        <ConfirmModal
          isOpen={showPdfGuideModal}
          title="PDF로 저장하기"
          message={'인쇄 창이 열리면 "대상(목적지)"을\n"PDF로 저장"으로 선택해 주세요.\n\n저장된 PDF는 본인 기기에만 보관됩니다.'}
          confirmText="인쇄 창 열기"
          cancelText="취소"
          onConfirm={handlePdfGuideConfirm}
          onCancel={() => setShowPdfGuideModal(false)}
          variant="warning"
        />
      </div>
    </div>
  )
}