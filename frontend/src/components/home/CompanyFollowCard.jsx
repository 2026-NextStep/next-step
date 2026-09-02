const LOGO_BG_COLORS = [
  'bg-orange-400',
  'bg-slate-600',
  'bg-purple-500',
  'bg-yellow-400',
  'bg-teal-500',
  'bg-blue-500',
]

export default function CompanyFollowCard({ company, index = 0, onToggleFollow }) {
  const logoBg = LOGO_BG_COLORS[index % LOGO_BG_COLORS.length]

  return (
    <div className="bg-white rounded-xl p-5 flex items-center gap-4 shadow-sm">
      {/* 로고 */}
      <div
        className={`w-12 h-12 rounded-full shrink-0 flex items-center justify-center overflow-hidden ${logoBg}`}
      >
        {company.logoUrl ? (
          <img src={company.logoUrl} alt={company.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-white text-sm font-bold">{company.name[0]}</span>
        )}
      </div>

      {/* 정보 */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-gray-900 truncate">{company.name}</h4>
        <p className="text-xs text-gray-400 mt-0.5 mb-1">{company.category}</p>
        <p className="text-xs font-medium text-blue-600">
          채용 중인 포지션 {company.openPositionCount}개
        </p>
      </div>

      {/* 팔로우 버튼 */}
      <button
        type="button"
        onClick={() => onToggleFollow(company.companyId)}
        className={`shrink-0 px-4 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
          company.isFollowing
            ? 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
            : 'bg-white text-blue-600 border-blue-500 hover:bg-blue-50'
        }`}
      >
        {company.isFollowing ? '팔로잉' : '팔로우'}
      </button>
    </div>
  )
}