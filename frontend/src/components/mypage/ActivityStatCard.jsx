const STATS = [
  {
    key: 'bookmarkCount',
    label: '북마크한 공고',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    key: 'aiAnalysisCount',
    label: 'AI 분석·요약 공고',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
      </svg>
    ),
  },
  {
    key: 'favoritePostCount',
    label: '즐겨찾기한 게시물',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
  {
    key: 'contractCount',
    label: '최근 분석한 계약서',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <polyline points="9 15 11 17 15 13" />
      </svg>
    ),
  },
]

export default function ActivityStatCard({ data }) {
  return (
    <div className="space-y-3">
      {STATS.map((stat) => (
        <div key={stat.key} className="bg-white rounded-xl shadow-sm p-4">
          <div className="mb-2">{stat.icon}</div>
          <p className="text-xs text-gray-400 mb-0.5">{stat.label}</p>
          <p className="text-2xl font-bold text-gray-900">
            {data[stat.key].toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  )
}
