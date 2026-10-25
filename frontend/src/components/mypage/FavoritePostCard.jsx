import { useNavigate } from 'react-router-dom'

const CATEGORY_STYLE = {
  멘토링: 'bg-blue-50 text-blue-500',
  자유게시판: 'bg-gray-100 text-gray-500',
  취업정보: 'bg-green-50 text-green-600',
  질문: 'bg-purple-50 text-purple-500',
}

export default function FavoritePostCard({ post }) {
  const navigate = useNavigate()
  const categoryStyle = CATEGORY_STYLE[post.category] ?? 'bg-gray-100 text-gray-500'

  function handleClick() {
    navigate(`/community/${post.postId}`)
  }

  return (
    <div
      className="bg-white border border-gray-100 rounded-xl px-5 py-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick() }}
    >
      {/* 본문 */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-gray-800 mb-1.5 truncate">{post.title}</h4>
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${categoryStyle}`}>
            {post.category}
          </span>
          <span>·</span>
          <span>{post.authorNickname}</span>
          <span>·</span>
          <span>{post.createdAt}</span>
        </div>
      </div>

      {/* 좋아요 + 댓글 */}
      <div className="flex items-center gap-3 shrink-0 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          {post.likeCount}
        </span>
        <span className="flex items-center gap-1">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {post.commentCount}
        </span>
      </div>
    </div>
  )
}
