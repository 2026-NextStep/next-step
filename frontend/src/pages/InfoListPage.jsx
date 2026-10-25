import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { isLoggedIn } from '../utils/authUtils'
import RecommendedInfoSection from '../components/info/RecommendedInfoSection'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080'
const PAGE_SIZE = 4
const CATEGORIES = ['공기업 채용 동향', '대기업 채용 소식', 'IT·스타트업 채용 트렌드', '취업시장 동향', '취업 전략']

function currentYearMonth() {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

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

export default function InfoListPage() {
  const [page, setPage] = useState(0)
  const [posts, setPosts] = useState([])
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('')
  const [yearMonth, setYearMonth] = useState(currentYearMonth)

  const monthParam = `${yearMonth.year}-${String(yearMonth.month).padStart(2, '0')}`
  const isCurrentMonth = (() => {
    const now = currentYearMonth()
    return yearMonth.year === now.year && yearMonth.month === now.month
  })()

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ page, size: PAGE_SIZE, category, month: monthParam })
    fetch(`${API_BASE}/api/v1/latest-info?${params}`)
      .then(r => r.json())
      .then(data => {
        setPosts(data.content || [])
        setTotalPages(data.totalPages || 1)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [page, category, monthParam])

  const handleCategoryClick = (c) => {
    setCategory(prev => prev === c ? '' : c)
    setPage(0)
  }

  const goPrevMonth = () => {
    setYearMonth(({ year, month }) => month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 })
    setPage(0)
  }

  const goNextMonth = () => {
    if (isCurrentMonth) return
    setYearMonth(({ year, month }) => month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 })
    setPage(0)
  }

  const windowSize = 5
  const half = Math.floor(windowSize / 2)
  const startPage = Math.max(0, Math.min(page - half, totalPages - windowSize))
  const pageNumbers = Array.from(
    { length: Math.min(windowSize, totalPages) },
    (_, i) => startPage + i
  )

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-screen-xl mx-auto px-16 py-8">

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-sm text-gray-400 mb-6">
          <Link to="/" className="hover:text-gray-600">홈</Link>
          <span>›</span>
          <span className="text-gray-600">취업 정보</span>
          <span>›</span>
          <span className="text-gray-800 font-medium">최신 구직·기업 정보</span>
        </div>

        {/* Hero */}
        <div className="bg-white rounded-2xl border border-gray-100 px-10 py-8 mb-6 shadow-sm">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full mb-4">
            <BriefingIcon /> 오늘의 취업·기업 브리핑
          </span>
          <h1 className="text-2xl font-bold text-gray-900 leading-snug">
            구직자 입장에서 바로 도움이 되는 채용 시장 흐름과 기업 소식을<br />한곳에서 볼 수 있게 정리했어요.
          </h1>
        </div>

        {/* 희망직무 기반 맞춤 소식 */}
        {isLoggedIn() && (
          <div className="bg-white rounded-2xl border border-gray-100 px-8 py-7 mb-6 shadow-sm">
            <RecommendedInfoSection />
          </div>
        )}

        {/* 필터 */}
        <div className="bg-white rounded-2xl border border-gray-100 px-6 py-4 mb-6 shadow-sm flex flex-wrap items-center gap-4">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(c => (
              <button
                key={c}
                onClick={() => handleCategoryClick(c)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                  category === c
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="w-px h-5 bg-gray-200 hidden sm:block" />
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={goPrevMonth}
              aria-label="이전 달"
              className="w-7 h-7 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
            >
              ‹
            </button>
            <span className="text-sm font-semibold text-gray-800 w-24 text-center whitespace-nowrap">
              {yearMonth.year}년 {yearMonth.month}월
            </span>
            <button
              onClick={goNextMonth}
              disabled={isCurrentMonth}
              aria-label="다음 달"
              className="w-7 h-7 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
              ›
            </button>
          </div>
        </div>

        {/* Content + Sidebar */}
        <div className="flex gap-6 items-start">

          {/* Article list */}
          <div className="flex-1 min-w-0 space-y-4">
            {loading ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-sm text-gray-400 shadow-sm">
                불러오는 중...
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-sm text-gray-400 shadow-sm">
                등록된 취업 정보가 없습니다.
              </div>
            ) : posts.map(post => {
              const summary = parseJson(post.aiFullSummary)
              return (
                <Link key={post.id} to={`/info/${post.id}`} className="block bg-white rounded-2xl border border-gray-100 p-7 shadow-sm hover:border-blue-200 hover:shadow-md transition-all">
                  {summary?.badge && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full mb-3">
                      <BriefingIcon /> {summary.badge}
                    </span>
                  )}
                  <h2 className="text-base font-bold text-gray-900 mb-2 leading-snug">{post.title}</h2>
                  <p className="text-sm text-gray-500 leading-relaxed mb-4 line-clamp-2">{post.subTitle}</p>
                  {summary?.bullets && (
                    <div className="bg-blue-50 rounded-xl p-4">
                      <p className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 mb-3">
                        <BriefingIcon /> AI 뉴스 요약
                      </p>
                      <ul className="space-y-2">
                        {summary.bullets.map((b, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                            {b}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Link>
              )
            })}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="flex items-center justify-center gap-1 pt-4 pb-2">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-3 h-9 text-sm rounded-lg text-gray-500 hover:bg-white hover:border hover:border-gray-200 disabled:opacity-30 transition-colors"
                >
                  이전
                </button>
                {pageNumbers.map(n => (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`w-9 h-9 text-sm rounded-lg transition-colors ${
                      n === page ? 'bg-blue-600 text-white font-semibold' : 'text-gray-500 hover:bg-white hover:border hover:border-gray-200'
                    }`}
                  >
                    {n + 1}
                  </button>
                ))}
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 h-9 text-sm rounded-lg text-gray-500 hover:bg-white hover:border hover:border-gray-200 disabled:opacity-30 transition-colors"
                >
                  다음
                </button>
              </div>
            )}
          </div>

          {/* AI 브리핑 카드 */}
          <div className="w-72 shrink-0 sticky top-24">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <p className="text-sm font-bold text-gray-900 mb-1">AI 브리핑 카드</p>
              <p className="text-xs text-gray-400 mb-5">구직자를 위한 핵심 요약과 추천 액션</p>

              {posts[0] && (() => {
                const action = parseJson(posts[0]?.aiFullSummary)
                return (
                  <>
                    <div className="bg-gray-50 rounded-xl p-4 mb-5">
                      <p className="text-xs font-semibold text-gray-700 mb-2">오늘의 요약</p>
                      <p className="text-xs text-gray-600 leading-relaxed">{posts[0]?.aiSummary3lines}</p>
                    </div>
                    {action?.bullets && (
                      <>
                        <p className="text-xs font-semibold text-gray-700 mb-3">추천 액션</p>
                        <div className="space-y-4">
                          {action.bullets.slice(0, 3).map((b, i) => {
                            const dots = ['bg-blue-500', 'bg-orange-400', 'bg-green-500']
                            return (
                              <div key={i} className="flex items-start gap-2.5">
                                <span className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${dots[i]}`} />
                                <p className="text-xs text-gray-600 leading-relaxed">{b}</p>
                              </div>
                            )
                          })}
                        </div>
                      </>
                    )}
                  </>
                )
              })()}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
