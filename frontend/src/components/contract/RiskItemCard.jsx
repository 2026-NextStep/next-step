import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import RiskBadge from './RiskBadge'

const LEFT_BORDER = {
  HIGH: 'border-l-red-400',
  MEDIUM: 'border-l-orange-400',
  LOW: 'border-l-green-400',
}

export default function RiskItemCard({ item }) {
  const [expanded, setExpanded] = useState(false)
  const hasDetail = !!(item.reason || item.recommendation)

  return (
    <div className={`border border-gray-100 border-l-4 ${LEFT_BORDER[item.level]} rounded-xl bg-white overflow-hidden`}>
      {/* 클릭 가능한 헤더 영역 */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left p-5"
      >
        {/* 제목 행 */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="shrink-0 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
              <svg
                width="11" height="11" viewBox="0 0 24 24"
                fill="none" stroke="#3b82f6" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round"
              >
                <line x1="12" y1="8" x2="12" y2="8" />
                <line x1="12" y1="12" x2="12" y2="16" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-gray-800">{item.title}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <RiskBadge level={item.level} />
            {hasDetail && (
              <span className="text-gray-400">
                {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </span>
            )}
          </div>
        </div>

        {/* 기본 설명 (항상 표시) */}
        <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>

        {!expanded && (
          <p className="mt-2 text-xs text-gray-400">
            자세히 보기
          </p>
        )}
      </button>

      {/* 펼쳐지는 상세 내용 */}
      <div
        className={`overflow-hidden transition-all duration-200 print:max-h-none print:overflow-visible  
          ${expanded ? 'max-h-96' : 'max-h-0'}`
        }
      >
        {hasDetail && (
          <div className="px-5 pb-5">
            <div className="bg-gray-50 rounded-lg px-4 py-3 text-xs text-gray-500 leading-relaxed space-y-1.5">
              {item.reason && <p><span className="font-medium text-gray-600">왜 문제인가요?</span> {item.reason}</p>}
              {item.recommendation && <p>{item.recommendation}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}