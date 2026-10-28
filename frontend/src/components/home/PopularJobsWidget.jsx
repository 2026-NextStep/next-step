import { Link } from 'react-router-dom'
import { Bookmark, Clock, Flame } from 'lucide-react'

/** "2026.11.06" → "마감 D-12" (스크랩 0건 공고에 스크랩수 대신 표시) */
function deadlineLabel(endDate) {
  if (!endDate) return '상시 채용'
  const [y, m, d] = endDate.split('.').map(Number)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.round((new Date(y, m - 1, d) - today) / 86400000)
  if (diff > 365) return '상시 채용' // 마감일을 2050년 등으로 둔 상시모집 공고
  return diff === 0 ? '오늘 마감' : `마감 D-${diff}`
}

const RANK_STYLE = [
  'bg-gradient-to-br from-orange-500 to-red-600 text-white',
  'bg-gradient-to-br from-amber-400 to-orange-500 text-white',
  'bg-gradient-to-br from-yellow-400 to-amber-500 text-white',
]

export default function PopularJobsWidget({ jobs }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {jobs.map((job, i) => {
        const rank = i + 1
        const isTop3 = i < 3
        return (
          <Link
            key={job.postingId}
            to={`/jobs/${job.postingId}`}
            className="group relative bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden"
          >
            {/* 랭크 리본 */}
            <div
              className={`absolute top-0 left-0 w-9 h-9 flex items-center justify-center text-sm font-extrabold rounded-br-xl ${
                isTop3 ? RANK_STYLE[i] : 'bg-gray-100 text-gray-500'
              }`}
            >
              {rank}
            </div>

            <div className="p-4 pt-5">
              <div className="flex justify-end mb-2 h-4">
                {isTop3 && <Flame size={15} className="text-orange-500 fill-orange-400" />}
              </div>
              <h4 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 mb-2 min-h-[2.6em] group-hover:text-orange-600 transition-colors">
                {job.title}
              </h4>
              <p className="text-xs text-gray-500 truncate mb-0.5">{job.companyName}</p>
              <p className="text-xs text-gray-400 truncate mb-3">{job.location}</p>
              {job.scrapCount > 0 ? (
                <div className="flex items-center gap-1 text-xs font-bold text-orange-500">
                  <Bookmark size={12} className="fill-orange-500" />
                  {job.scrapCount.toLocaleString()}명이 스크랩
                </div>
              ) : (
                <div className="flex items-center gap-1 text-xs font-semibold text-gray-400">
                  <Clock size={12} />
                  {deadlineLabel(job.endDate)}
                </div>
              )}
            </div>
          </Link>
        )
      })}
    </div>
  )
}
