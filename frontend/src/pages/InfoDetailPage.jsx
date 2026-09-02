import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080'

function BriefingIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
    </svg>
  )
}


function parseJson(str) {
  try { return JSON.parse(str) } catch { return null }
}

export default function InfoDetailPage() {
  const { id } = useParams()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetch(`${API_BASE}/api/v1/latest-info/${id}`)
      .then(r => {
        if (!r.ok) { setNotFound(true); setLoading(false); return null }
        return r.json()
      })
      .then(data => {
        if (data) { setPost(data); setLoading(false) }
      })
      .catch(() => { setNotFound(true); setLoading(false) })
  }, [id])

  if (loading) return (
    <div className="bg-gray-50 min-h-screen flex items-center justify-center text-sm text-gray-400">
      불러오는 중...
    </div>
  )

  if (notFound || !post) return (
    <div className="bg-gray-50 min-h-screen flex items-center justify-center text-sm text-gray-400">
      존재하지 않는 게시글입니다.
    </div>
  )

  const summary = parseJson(post.aiFullSummary) || {}
  const action  = parseJson(post.aiAction) || {}

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-screen-xl mx-auto px-16 py-8">

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-sm text-gray-400 mb-6">
          <Link to="/" className="hover:text-gray-600">홈</Link>
          <span>›</span>
          <Link to="/info" className="hover:text-gray-600">취업 정보</Link>
          <span>›</span>
          <span className="text-gray-800 font-medium">최신 구직·기업 정보</span>
        </div>

        {/* Content + Sidebar */}
        <div className="flex gap-6 items-start">

          {/* Main content */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* Title card */}
            <div className="bg-white rounded-2xl border border-gray-100 px-8 py-7 shadow-sm">
              {summary.badge && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full mb-3">
                  <BriefingIcon /> {summary.badge}
                </span>
              )}
              <h1 className="text-xl font-bold text-gray-900 leading-snug">{post.title}</h1>
              <p className="text-sm text-gray-500 leading-relaxed mt-3">{post.subTitle}</p>
            </div>

            {/* AI 핵심 요약 */}
            {summary.bullets && (
              <div className="bg-white rounded-2xl border border-gray-100 px-8 py-7 shadow-sm">
                <h2 className="text-base font-bold text-gray-900 mb-4">AI 핵심 요약</h2>
                <div className="bg-blue-50 rounded-xl p-5">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 mb-3">
                    <BriefingIcon /> {summary.header || '구직자가 먼저 확인해야 할 포인트'}
                  </p>
                  <ul className="space-y-2.5">
                    {summary.bullets.map((b, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* 시장 흐름 읽기 */}
            {post.aiTodayBrief && (
              <div className="bg-white rounded-2xl border border-gray-100 px-8 py-7 shadow-sm">
                <h2 className="text-base font-bold text-gray-900 mb-4">시장 흐름 읽기</h2>
                {post.aiTodayBrief.split('\n\n').map((para, i) => (
                  <p key={i} className="text-sm text-gray-700 leading-relaxed mb-4 last:mb-0">{para}</p>
                ))}
              </div>
            )}

            {/* 구직자 액션 가이드 */}
            {(action.quote || action.bullets) && (
              <div className="bg-white rounded-2xl border border-gray-100 px-8 py-7 shadow-sm">
                <h2 className="text-base font-bold text-gray-900 mb-4">구직자 액션 가이드</h2>
                {action.quote && (
                  <blockquote className="border-l-4 border-blue-400 pl-4 py-1 mb-5">
                    <p className="text-sm text-gray-600 leading-relaxed italic">{action.quote}</p>
                  </blockquote>
                )}
                {action.bullets && (
                  <ul className="space-y-2.5">
                    {action.bullets.map((b, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
                        {b}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}


          </div>

          {/* AI 브리핑 카드 */}
          <div className="w-72 shrink-0 sticky top-24">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <p className="text-sm font-bold text-gray-900 mb-1">AI 브리핑 카드</p>
              <p className="text-xs text-gray-400 mb-5 leading-relaxed">
                원래 카드 구조를 유지하면서 상세 페이지에서도 바로 핵심을 다시 볼 수 있게 구성했습니다.
              </p>

              {post.aiSummary3lines && (
                <div className="bg-gray-50 rounded-xl p-4 mb-5">
                  <p className="text-xs font-semibold text-gray-700 mb-2">3줄 요약</p>
                  <p className="text-xs text-gray-600 leading-relaxed">{post.aiSummary3lines}</p>
                </div>
              )}

              {action.card_items && (
                <div className="space-y-4">
                  {action.card_items.map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${item.dot}`} />
                      <div>
                        <p className="text-xs font-semibold text-gray-800 leading-snug mb-0.5">{item.label}</p>
                        <p className="text-xs text-gray-500 leading-relaxed">{item.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
