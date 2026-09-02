import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getCurrentUser,
  getBookmarkedPostings,
  getAIAnalysisPostings,
  getFavoritePosts,
  updateUser,
  uploadProfileImage,
  deleteProfileImage,
  changePassword,
} from '../api/user'
import SideMenu from '../components/mypage/SideMenu'
import BasicInfoCard from '../components/mypage/BasicInfoCard'
import PasswordChangeForm from '../components/mypage/PasswordChangeForm'
import BookmarkedJobCard from '../components/mypage/BookmarkedJobCard'
import FavoritePostCard from '../components/mypage/FavoritePostCard'
import EmptySection from '../components/mypage/EmptySection'

const SECTION_ORDER = ['profile', 'bookmarks', 'ai-analysis', 'favorites', 'contracts']

const SECTION_IDS = {
  profile: 'profile-management',
  bookmarks: 'bookmarked-jobs',
  'ai-analysis': 'ai-analysis-jobs',
  favorites: 'favorite-posts',
  contracts: 'recent-contracts',
}

const ID_TO_KEY = Object.fromEntries(
  Object.entries(SECTION_IDS).map(([key, id]) => [id, key])
)

const INITIAL_COUNT = 3

function SectionHeader({ title, count, expanded, onToggle }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <h3 className="text-lg font-bold text-gray-900">
        {title}{' '}
        {count !== undefined && <span className="text-blue-500">{count}</span>}
      </h3>
      {onToggle && (
        <button
          type="button"
          className="flex items-center gap-0.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          onClick={onToggle}
        >
          {expanded ? '접기' : '전체보기'}
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: expanded ? 'rotate(-90deg)' : 'rotate(90deg)', transition: 'transform 0.2s' }}
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      )}
    </div>
  )
}

export default function MyPage() {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState('profile')
  const [user, setUser] = useState(null)
  const [bookmarks, setBookmarks] = useState([])
  const [aiPostings, setAiPostings] = useState([])
  const [favPosts, setFavPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [bookmarksExpanded, setBookmarksExpanded] = useState(false)
  const [aiExpanded, setAiExpanded] = useState(false)
  const [favExpanded, setFavExpanded] = useState(false)

  const basicInfoRef = useRef(null)
  const passwordFormRef = useRef(null)
  const isClickScrollingRef = useRef(false)

  useEffect(() => {
    Promise.all([
      getCurrentUser(),
      getBookmarkedPostings().catch(() => []),
      getAIAnalysisPostings().catch(() => []),
      getFavoritePosts().catch(() => []),
    ])
      .then(([u, bm, ai, fav]) => {
        setUser(u)
        setBookmarks(bm)
        setAiPostings(ai)
        setFavPosts(fav)
      })
      .catch((err) => console.error('마이페이지 로드 실패:', err))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (loading) return

    const visibleSections = new Set()

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const key = ID_TO_KEY[entry.target.id]
          if (!key) return
          if (entry.isIntersecting) {
            visibleSections.add(key)
          } else {
            visibleSections.delete(key)
          }
        })
        if (isClickScrollingRef.current) return
        const topmost = SECTION_ORDER.find((key) => visibleSections.has(key))
        if (topmost) setActiveSection(topmost)
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    )

    SECTION_ORDER.forEach((key) => {
      const el = document.getElementById(SECTION_IDS[key])
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [loading])

  const scrollToSection = (targetId) => {
    const key = ID_TO_KEY[targetId]
    if (key) setActiveSection(key)

    isClickScrollingRef.current = true
    setTimeout(() => { isClickScrollingRef.current = false }, 800)

    const el = document.getElementById(targetId)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleSaveAll = async () => {
    // 1) 닉네임 중복 확인 검증
    if (!basicInfoRef.current?.isNicknameReady()) {
      alert('닉네임 중복 확인을 해주세요.')
      return
    }

    // 2) 비밀번호 검증 (카카오 사용자는 건너뜀)
    if (user.provider !== 'kakao') {
      const pwError = passwordFormRef.current?.getValidationError()
      if (pwError === 'noCurrentPw') {
        alert('현재 비밀번호를 입력해주세요.')
        return
      }
      if (pwError === 'conditions') {
        alert('비밀번호 조건을 확인해주세요.')
        return
      }
      if (pwError === 'mismatch') {
        alert('비밀번호가 일치하지 않습니다.')
        return
      }
    }

    setIsSaving(true)
    try {
      // 3) 프로필 이미지 처리 (업로드 / 삭제 / 변경 없음)
      const imageAction = basicInfoRef.current?.getImageAction() ?? { type: 'none', file: null }
      let uploadedImageUrl = null

      if (imageAction.type === 'upload') {
        try {
          const result = await uploadProfileImage(imageAction.file)
          uploadedImageUrl = result.profileImage
        } catch (err) {
          console.error('프로필 이미지 업로드 실패:', err)
          alert('프로필 이미지 업로드에 실패했습니다.')
          return
        }
      } else if (imageAction.type === 'delete') {
        try {
          await deleteProfileImage()
        } catch (err) {
          console.error('프로필 이미지 삭제 실패:', err)
          alert('프로필 이미지 삭제에 실패했습니다.')
          return
        }
      }

      // 4) 기본 정보 업데이트
      const basicValues = basicInfoRef.current?.getValues()
      if (basicValues) {
        const payload = { ...basicValues }
        if (uploadedImageUrl) {
          payload.profileImage = uploadedImageUrl
        }
        const updatedUser = await updateUser(payload)
        if (imageAction.type === 'upload') {
          setUser(updatedUser)
        } else if (imageAction.type === 'delete') {
          setUser(prev => ({ ...updatedUser, profileImage: null }))
        } else {
          setUser(prev => ({ ...updatedUser, profileImage: prev.profileImage }))
        }
      }

      // 6) 비밀번호 변경 (카카오는 건너뜀)
      if (user.provider !== 'kakao') {
        const pwValues = passwordFormRef.current?.tryGetValues()
        if (pwValues) {
          await changePassword(pwValues)
          passwordFormRef.current?.reset()
        }
      }

      // 7) 성공 알림
      alert('변경사항이 저장되었습니다.')
    } catch (error) {
      const message = error?.response?.data?.message
        || error?.message
        || '저장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
      alert(message)
      console.error('마이페이지 저장 실패:', error)
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-400">불러오는 중...</p>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="flex gap-6 p-6 max-w-screen-xl mx-auto items-start">

        {/* 좌측 사이드 메뉴 */}
        <SideMenu activeSection={activeSection} onScrollTo={scrollToSection} />

        {/* 메인 콘텐츠 */}
        <main className="flex-1 min-w-0 space-y-5">

          {/* 프로필 관리 카드 */}
          <div id="profile-management" className="scroll-mt-20 bg-white rounded-2xl shadow-sm p-7">
            <div className="flex items-start justify-between mb-7">
              <div>
                <h2 className="text-xl font-bold text-gray-900">프로필 관리</h2>
                <p className="text-sm text-gray-400 mt-0.5">기본 정보와 비밀번호를 수정할 수 있습니다.</p>
              </div>
              <button
                type="button"
                onClick={handleSaveAll}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed rounded-lg transition-colors shrink-0"
              >
                {isSaving ? '저장 중...' : '변경사항 저장'}
              </button>
            </div>

            {user && (
              <BasicInfoCard
                ref={basicInfoRef}
                user={user}
              />
            )}
            {user && user.provider !== 'kakao' && (
              <PasswordChangeForm ref={passwordFormRef} />
            )}
          </div>

          {/* 북마크한 채용 공고 */}
          <div id="bookmarked-jobs" className="scroll-mt-20 bg-white rounded-2xl shadow-sm p-6">
            <SectionHeader
              title="북마크한 채용 공고"
              count={bookmarks.length}
              expanded={bookmarksExpanded}
              onToggle={bookmarks.length > INITIAL_COUNT ? () => setBookmarksExpanded(e => !e) : undefined}
            />
            {bookmarks.length === 0 ? (
              <EmptySection
                icon={
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                }
                title="아직 북마크한 공고가 없어요"
                description="관심 있는 채용 공고를 북마크해보세요"
                actionLabel="채용 공고 보러 가기"
                actionPath="/jobs"
              />
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {(bookmarksExpanded ? bookmarks : bookmarks.slice(0, INITIAL_COUNT)).map((p) => (
                  <BookmarkedJobCard
                    key={p.postingId}
                    posting={p}
                    onClick={() => navigate(`/jobs/${p.postingId}`)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* AI 분석/요약 공고 */}
          <div id="ai-analysis-jobs" className="scroll-mt-20 bg-white rounded-2xl shadow-sm p-6">
            <SectionHeader
              title="AI 요약/분석 공고"
              count={aiPostings.length}
              expanded={aiExpanded}
              onToggle={aiPostings.length > INITIAL_COUNT ? () => setAiExpanded(e => !e) : undefined}
            />
            {aiPostings.length === 0 ? (
              <EmptySection
                icon={
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                }
                title="아직 AI 분석을 요청한 공고가 없어요"
                description="채용 공고 상세 페이지에서 AI 분석을 받아보세요"
                actionLabel="채용 공고 보러 가기"
                actionPath="/jobs"
              />
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {(aiExpanded ? aiPostings : aiPostings.slice(0, INITIAL_COUNT)).map((p) => (
                  <BookmarkedJobCard
                    key={p.postingId}
                    posting={p}
                    showBookmark={false}
                    onClick={() => navigate(`/jobs/${p.postingId}/ai`)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* 즐겨찾기한 커뮤니티 게시물 */}
          <div id="favorite-posts" className="scroll-mt-20 bg-white rounded-2xl shadow-sm p-6">
            <SectionHeader
              title="즐겨찾기한 커뮤니티 게시물"
              count={favPosts.length}
              expanded={favExpanded}
              onToggle={favPosts.length > INITIAL_COUNT ? () => setFavExpanded(e => !e) : undefined}
            />
            {favPosts.length === 0 ? (
              <EmptySection
                icon={
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                }
                title="아직 즐겨찾기한 게시물이 없어요"
                description="관심 있는 커뮤니티 글을 즐겨찾기해보세요"
                actionLabel="커뮤니티 보러 가기"
                actionPath="/community"
              />
            ) : (
              <div className="space-y-3">
                {(favExpanded ? favPosts : favPosts.slice(0, INITIAL_COUNT)).map((p) => (
                  <FavoritePostCard
                    key={p.postId}
                    post={p}
                  />
                ))}
              </div>
            )}
          </div>

          {/* 최근 분석한 계약서 (placeholder)
          <div id="recent-contracts" className="scroll-mt-20 bg-white rounded-2xl shadow-sm p-6">
            <SectionHeader title="최근 분석한 계약서" />
            <div className="py-10 flex flex-col items-center gap-2 text-gray-400">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-40">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              <p className="text-sm">분석한 계약서가 없습니다.</p>
            </div>
          </div> */}

        </main>
      </div>
    </div>
  )
}