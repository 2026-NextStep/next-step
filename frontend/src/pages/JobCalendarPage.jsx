import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080'
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

const STATUS_STYLE = {
  '접수중':   'bg-blue-50 text-blue-600',
  '마감임박': 'bg-red-50 text-red-500',
  '마감':    'bg-gray-100 text-gray-400',
}

function currentYearMonth() {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

function dayOfMonthFromDotDate(dotDate) {
  // "2026.09.05" -> 5
  const parts = dotDate?.split('.')
  if (!parts || parts.length !== 3) return null
  return parseInt(parts[2], 10)
}

export default function JobCalendarPage() {
  const [yearMonth, setYearMonth] = useState(currentYearMonth)
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState(null)

  const monthParam = `${yearMonth.year}-${String(yearMonth.month).padStart(2, '0')}`

  useEffect(() => {
    setLoading(true)
    setSelectedDay(null)
    fetch(`${API_BASE}/api/v1/jobs/calendar?month=${monthParam}`)
      .then(r => r.json())
      .then(data => {
        setJobs(data || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [monthParam])

  const jobsByDay = useMemo(() => {
    const map = {}
    for (const job of jobs) {
      const day = dayOfMonthFromDotDate(job.end)
      if (!day) continue
      if (!map[day]) map[day] = []
      map[day].push(job)
    }
    return map
  }, [jobs])

  const { leadingBlanks, daysInMonth } = useMemo(() => {
    const first = new Date(yearMonth.year, yearMonth.month - 1, 1)
    const last = new Date(yearMonth.year, yearMonth.month, 0)
    return { leadingBlanks: first.getDay(), daysInMonth: last.getDate() }
  }, [yearMonth])

  const goPrevMonth = () => {
    setYearMonth(({ year, month }) => month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 })
  }
  const goNextMonth = () => {
    setYearMonth(({ year, month }) => month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 })
  }

  const today = new Date()
  const isCurrentMonth = today.getFullYear() === yearMonth.year && today.getMonth() + 1 === yearMonth.month
  const todayDate = isCurrentMonth ? today.getDate() : null

  const cells = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const selectedJobs = selectedDay ? (jobsByDay[selectedDay] || []) : []

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-screen-xl mx-auto px-16 py-8">

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-sm text-gray-400 mb-6">
          <Link to="/" className="hover:text-gray-600">홈</Link>
          <span>›</span>
          <Link to="/jobs" className="hover:text-gray-600">공고 목록 조회</Link>
          <span>›</span>
          <span className="text-gray-800 font-medium">마감 캘린더</span>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">채용공고 마감 캘린더</h1>
          <Link to="/jobs" className="text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors">
            목록형으로 보기 →
          </Link>
        </div>

        {/* 월 네비게이터 */}
        <div className="bg-white rounded-2xl border border-gray-100 px-6 py-4 mb-6 shadow-sm flex items-center justify-center gap-4">
          <button onClick={goPrevMonth} aria-label="이전 달"
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 transition-colors">‹</button>
          <span className="text-base font-bold text-gray-900 w-28 text-center">
            {yearMonth.year}년 {yearMonth.month}월
          </span>
          <button onClick={goNextMonth} aria-label="다음 달"
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 transition-colors">›</button>
        </div>

        {/* 캘린더 그리드 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
          <div className="grid grid-cols-7 border-b border-gray-100">
            {WEEKDAYS.map((w, i) => (
              <div key={w} className={`text-center text-xs font-semibold py-3 ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'}`}>
                {w}
              </div>
            ))}
          </div>
          {loading ? (
            <div className="py-24 text-center text-sm text-gray-400">불러오는 중...</div>
          ) : (
            <div className="grid grid-cols-7">
              {cells.map((day, idx) => {
                if (day === null) return <div key={`b${idx}`} className="min-h-24 border-b border-r border-gray-50" />
                const dayJobs = jobsByDay[day] || []
                const isToday = day === todayDate
                const isSelected = day === selectedDay
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(dayJobs.length > 0 ? day : null)}
                    className={`min-h-24 border-b border-r border-gray-50 p-2 text-left flex flex-col gap-1 transition-colors ${
                      isSelected ? 'bg-blue-50' : dayJobs.length > 0 ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-default'
                    }`}
                  >
                    <span className={`text-xs font-semibold w-5 h-5 flex items-center justify-center rounded-full ${
                      isToday ? 'bg-blue-600 text-white' : 'text-gray-600'
                    }`}>
                      {day}
                    </span>
                    {dayJobs.length > 0 && (
                      <span className="text-[11px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded self-start">
                        마감 {dayJobs.length}건
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* 선택된 날짜의 공고 목록 */}
        {selectedDay && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-base font-bold text-gray-900 mb-4">
              {yearMonth.year}.{String(yearMonth.month).padStart(2, '0')}.{String(selectedDay).padStart(2, '0')} 마감 공고 ({selectedJobs.length}건)
            </h2>
            <div className="space-y-2">
              {selectedJobs.map(job => (
                <Link
                  key={job.id}
                  to={`/jobs/${job.id}`}
                  className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">{job.title}</p>
                    <p className="text-xs text-gray-400 truncate">{job.org} · {job.workLocation}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded shrink-0 ${STATUS_STYLE[job.status] ?? 'bg-gray-100 text-gray-400'}`}>
                    {job.status}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
