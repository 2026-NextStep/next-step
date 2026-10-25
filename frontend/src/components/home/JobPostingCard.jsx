import { useNavigate } from 'react-router-dom'
import { Bookmark } from 'lucide-react'

const GRADIENTS = [
  'from-slate-500 to-blue-700',
  'from-blue-600 to-violet-700',
  'from-teal-500 to-emerald-700',
  'from-slate-500 to-slate-700',
  'from-blue-900 to-slate-900',
  'from-slate-700 to-slate-900',
  'from-cyan-800 to-blue-900',
  'from-indigo-800 to-slate-900',
]

const STATUS_STYLE = {
  '접수중':   'bg-green-50 text-green-600',
  '마감임박': 'bg-red-50 text-red-500',
  '마감':    'bg-gray-100 text-gray-400',
}

export default function JobPostingCard({ posting, index = 0, onBookmark }) {
  const navigate = useNavigate()
  const gradient = GRADIENTS[index % GRADIENTS.length]
  const statusStyle = STATUS_STYLE[posting.status] ?? 'bg-gray-100 text-gray-400'

  return (
    <div
      className="bg-white rounded-xl shadow-sm overflow-hidden hover:-translate-y-1 transition-transform duration-200 cursor-pointer"
      onClick={() => navigate('/jobs')}
    >
      {/* 썸네일 */}
      <div className={`relative w-full aspect-video bg-gradient-to-br ${gradient}`}>
        <button
          type="button"
          aria-label="북마크"
          className="absolute top-2.5 right-2.5 w-7 h-7 flex items-center justify-center bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/35 transition-colors"
          onClick={(e) => {
            e.stopPropagation()
            onBookmark?.(posting.postingId)
          }}
        >
          <Bookmark size={13} />
        </button>
      </div>

      {/* 본문 */}
      <div className="p-5">
        <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug mb-1.5">
          {posting.title}
        </h4>
        <p className="text-xs text-gray-600 mb-1">{posting.companyName}</p>
        <p className="text-xs text-gray-400 mb-3">{posting.location}</p>
        <div className="flex items-center justify-between gap-2">
          {posting.status && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded shrink-0 ${statusStyle}`}>
              {posting.status}
            </span>
          )}
          {posting.endDate && (
            <span className="text-xs text-gray-400 truncate">
              ~{posting.endDate}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
