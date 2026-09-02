import { useState, useEffect } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import Logo from './Logo'
import { isLoggedIn, clearAuth } from '../../utils/authUtils'

const TABS = [
  { label: '채용 공고',   to: '/jobs' },
  { label: '자소서 챗봇', to: '/chatbot' },
  { label: '취업 정보',   to: '/info' },
  { label: '계약서 분석', to: '/contract/upload' },
  { label: '커뮤니티',    to: '/community' },
]

const TAB_BASE =
  "relative flex items-center px-4 text-sm font-medium whitespace-nowrap cursor-pointer " +
  "transition-colors duration-200 " +
  "after:content-[''] after:absolute after:bottom-0 after:left-0 " +
  "after:h-0.5 after:bg-blue-500 after:transition-[width] after:duration-200"

export default function Header() {
  const { pathname } = useLocation()
  const navigate     = useNavigate()
  const isMyPage     = pathname.startsWith('/mypage')

  const [loggedIn, setLoggedIn] = useState(isLoggedIn)

  // 라우트 변경 시마다 토큰 재확인 (로그인/로그아웃 직후 동기화)
  useEffect(() => {
    setLoggedIn(isLoggedIn())
  }, [pathname])

  // 다른 탭에서 토큰 변경 시 동기화
  useEffect(() => {
    const handleStorage = () => setLoggedIn(isLoggedIn())
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const handleLogout = () => {
    clearAuth()
    setLoggedIn(false)
    window.dispatchEvent(new CustomEvent('nextstep:logout'))
    // 보호된 페이지에 있었다면 메인으로, 아니면 그 자리 유지
    const isProtected = ['/mypage', '/contract'].some(p => pathname.startsWith(p))
    navigate(isProtected ? '/' : pathname, { replace: true })
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm print:hidden">
      <div className="max-w-screen-xl mx-auto h-16 flex items-stretch px-6 gap-8">

        {/* 로고 */}
        <Logo />

        {/* 탭 네비게이션 */}
        <nav className="flex items-stretch flex-1">
          {TABS.map((tab) => (
            <NavLink
              key={tab.label}
              to={tab.to}
              className={({ isActive }) =>
                isActive
                  ? `${TAB_BASE} text-blue-500 after:w-full`
                  : `${TAB_BASE} text-gray-500 hover:text-blue-500 after:w-0 hover:after:w-full`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>

        {/* 우측 영역 */}
        <div className="flex items-center gap-3 shrink-0">

          {loggedIn ? (
            <>
              {/* 마이페이지 아이콘 */}
              <Link
                to="/mypage"
                aria-label="마이페이지"
                className={`p-1.5 transition-colors duration-200 hover:text-blue-500 ${
                  isMyPage ? 'text-blue-600' : 'text-gray-400'
                }`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M20 21a8 8 0 1 0-16 0" />
                </svg>
              </Link>

              {/* 로그아웃 */}
              <button
                type="button"
                onClick={handleLogout}
                className="text-sm text-gray-400 hover:text-red-500 transition-colors duration-200 px-1"
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm text-gray-500 hover:text-blue-500 font-medium transition-colors duration-200"
              >
                로그인
              </Link>
              <span className="text-gray-200 select-none">|</span>
              <Link
                to="/signup"
                className="text-sm text-blue-600 hover:text-blue-700 font-semibold transition-colors duration-200"
              >
                회원가입
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}