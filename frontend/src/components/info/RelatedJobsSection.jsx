import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, MapPin } from 'lucide-react'
import { getRelatedJobs } from '../../api/info'

const STATUS_STYLE = {
  마감임박: 'text-red-600 bg-red-50',
  접수중: 'text-green-600 bg-green-50',
}

function dDay(end) {
  if (!end) return null
  const [y, m, d] = end.split('.').map(Number)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.round((new Date(y, m - 1, d) - today) / 86400000)
  return diff === 0 ? 'D-Day' : `D-${diff}`
}

/** 최신정보 상세 하단 — 기사와 연결된 접수 중 채용공고 */
export default function RelatedJobsSection({ infoId }) {
  // 어떤 기사에 대한 결과인지 함께 저장 — 기사 이동 시 이전 결과 대신 로딩 표시
  const [result, setResult] = useState({ infoId: null, items: [] })
  const loading = result.infoId !== infoId
  const items = result.items

  useEffect(() => {
    let alive = true
    getRelatedJobs(infoId)
      .then((res) => alive && setResult({ infoId, items: res }))
      .catch(() => alive && setResult({ infoId, items: [] }))
    return () => { alive = false }
  }, [infoId])

  if (!loading && items.length === 0) return null

  return (
    <div className="bg-white rounded-2xl border border-gray-100 px-8 py-7 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="flex items-center gap-1.5 text-base font-bold text-gray-900">
          <Briefcase size={16} className="text-blue-500" />
          이 소식과 관련된 채용공고
        </h2>
        <Link to="/jobs" className="text-xs text-gray-400 hover:text-gray-600">채용공고 더보기</Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-28 rounded-xl bg-gray-100 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map(({ job, reason }) => (
            <Link
              key={job.id}
              to={`/jobs/${job.id}`}
              className="block rounded-xl border border-gray-100 p-4 hover:border-blue-200 hover:bg-blue-50/30 transition-colors"
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs text-gray-500 truncate">{job.org}</span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${STATUS_STYLE[job.status] ?? 'text-gray-500 bg-gray-100'}`}>
                  {dDay(job.end) ?? job.status}
                </span>
              </div>
              <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug mb-2">{job.title}</p>
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-2.5">
                {job.workLocation && (
                  <span className="flex items-center gap-0.5 truncate"><MapPin size={11} />{job.workLocation}</span>
                )}
                {job.employmentType && <span className="truncate">· {job.employmentType}</span>}
              </div>
              <p className="text-xs text-blue-700 bg-blue-50 rounded-md px-2.5 py-1.5">{reason}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
