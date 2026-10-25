import { User, Bookmark, Sparkles, Star, Gauge } from 'lucide-react'

const SECTIONS = [
  {
    label: '계정 관리',
    items: [
      { key: 'profile', label: '프로필 관리', targetId: 'profile-management', Icon: User },
    ],
  },
  {
    label: '취업 준비',
    items: [
      { key: 'career', label: '취업 준비 현황', targetId: 'career-dashboard', Icon: Gauge },
    ],
  },
  {
    label: '나의 활동',
    items: [
      { key: 'bookmarks', label: '북마크한 공고', targetId: 'bookmarked-jobs', Icon: Bookmark },
      { key: 'ai-analysis', label: 'AI 분석/요약 공고', targetId: 'ai-analysis-jobs', Icon: Sparkles },
      { key: 'favorites', label: '즐겨찾기한 게시물', targetId: 'favorite-posts', Icon: Star },
      // { key: 'contracts', label: '최근 분석한 계약서', targetId: 'recent-contracts', Icon: FileText },
    ],
  },
]

export default function SideMenu({ activeSection, onScrollTo }) {
  return (
    <aside className="w-[240px] shrink-0 sticky top-6 self-start">
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-base font-bold text-gray-900 mb-6">마이페이지</h2>

        {SECTIONS.map((section) => (
          <div key={section.label} className="mb-5 last:mb-0">
            <p className="text-xs text-gray-400 font-medium mb-2">{section.label}</p>
            {section.items.map(({ key, label, targetId, Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => onScrollTo(targetId)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors duration-200 text-left ${
                  activeSection === key
                    ? 'bg-blue-50 text-blue-600 font-medium border-l-2 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 border-l-2 border-transparent'
                }`}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>
        ))}
      </div>
    </aside>
  )
}
