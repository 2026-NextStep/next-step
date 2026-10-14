import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { getRecommendedInfo } from '../../api/info'

/**
 * "OO님을 위한 맞춤 소식" — 희망직무 기반으로 AI가 고른 최신정보 + 추천 이유 한 줄.
 * 로그인 사용자에게만 렌더링하는 쪽(부모)에서 노출 여부를 결정한다.
 */
export default function RecommendedInfoSection({ limit = 4, className = '' }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let alive = true
    getRecommendedInfo()
      .then((res) => alive && setData(res))
      .catch(() => alive && setFailed(true))
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [])

  if (failed) return null

  const nickname = data?.nickname
  const items = (data?.items ?? []).slice(0, limit)

  return (
    <section className={className}>
      <div className="flex items-end justify-between mb-4 gap-4">
        <div>
          <h2 className="flex items-center gap-1.5 text-xl font-bold text-gray-900">
            <Sparkles size={18} className="text-blue-500" />
            {nickname ? `${nickname}님을 위한 맞춤 소식` : '나를 위한 맞춤 소식'}
          </h2>
          {data?.desiredJob && (
            <p className="text-xs text-gray-400 mt-1">
              희망 직무 <span className="font-medium text-gray-600">'{data.desiredJob}'</span> 기준으로 AI가 골랐어요
            </p>
          )}
        </div>
        {data?.desiredJob && (
          <Link to="/mypage" className="text-xs text-gray-400 hover:text-gray-600 whitespace-nowrap">
            희망 직무 변경
          </Link>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="h-44 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : !data?.desiredJob ? (
        <div className="border-2 border-dashed border-gray-200 rounded-xl py-10 flex flex-col items-center gap-2 text-center">
          <p className="text-sm font-medium text-gray-600">희망 직무를 입력하면 맞춤 소식을 골라드려요</p>
          <p className="text-xs text-gray-400">예: 백엔드 개발자, 공기업 사무직, 간호사</p>
          <Link
            to="/mypage"
            className="mt-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            희망 직무 입력하기
          </Link>
        </div>
      ) : items.length === 0 ? (
        <p className="py-10 text-center text-sm text-gray-400">아직 추천할 소식이 없어요.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((info) => (
            <Link
              key={info.id}
              to={`/info/${info.id}`}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3 hover:-translate-y-1 hover:border-blue-200 transition-all duration-200"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full truncate">
                  {info.category || 'AI 요약'}
                </span>
                <span className="text-xs text-gray-400 shrink-0">{info.createdAt}</span>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">{info.title}</h3>
              {info.subTitle && (
                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{info.subTitle}</p>
              )}
              {info.reason && (
                <p className="mt-auto flex items-start gap-1.5 text-xs text-blue-700 bg-blue-50/70 rounded-lg px-3 py-2 leading-relaxed">
                  <Sparkles size={12} className="mt-0.5 shrink-0" />
                  {info.reason}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
