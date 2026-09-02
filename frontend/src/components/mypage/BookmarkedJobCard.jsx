export default function BookmarkedJobCard({ posting, onClick, showBookmark = true }) {
  return (
    <div
      className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col gap-3 cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      {/* D-day 뱃지 + 북마크 아이콘 */}
      <div className="flex items-center justify-between">
        {posting.isAlwaysRecruiting ? (
          <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded">
            상시채용
          </span>
        ) : (
          <span className="text-xs font-bold text-red-500 bg-red-50 px-2.5 py-0.5 rounded">
            D-{posting.dDay}
          </span>
        )}
        {showBookmark && (
          <button
            type="button"
            aria-label="북마크"
            className="transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <svg width="16" height="16" viewBox="0 0 24 24"
              fill="#3b82f6"
              stroke="#3b82f6"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </button>
        )}
      </div>

      {/* 회사명 + 제목 */}
      <div>
        <p className="text-xs text-gray-400 mb-1">{posting.companyName}</p>
        <h4 className="text-sm font-semibold text-gray-800 leading-snug line-clamp-2">
          {posting.title}
        </h4>
      </div>

      {/* 태그 */}
      <div className="flex flex-wrap gap-1.5">
        {[posting.careerLevel, posting.location, posting.employmentType]
          .filter(Boolean)
          .map((tag) => (
            <span
              key={tag}
              className="text-xs text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-md"
            >
              {tag}
            </span>
          ))}
      </div>
    </div>
  )
}
