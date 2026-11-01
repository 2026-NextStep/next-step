import { Outlet, ScrollRestoration } from 'react-router-dom'
import Header from './Header'

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main>
        <Outlet />
      </main>
      {/* 페이지 이동 시 맨 위부터 표시 (뒤로 가기는 이전 스크롤 위치 복원) */}
      <ScrollRestoration />
    </div>
  )
}
