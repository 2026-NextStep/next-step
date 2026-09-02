import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Layout from './components/common/Layout'
import PrivateRoute from './components/common/PrivateRoute'
import HomePage from './pages/HomePage'
import MyPage from './pages/MyPage'
import ContractUploadPage from './pages/ContractUploadPage'
import ContractResultPage from './pages/ContractResultPage'
import Login from './pages/Login'
import Signup from './pages/Signup'
import KakaoCallback from './pages/KakaoCallback'
import JobListPage from './pages/JobListPage'
import InfoListPage from './pages/InfoListPage'
import InfoDetailPage from './pages/InfoDetailPage'
import Community from './pages/Community'
import CommunityDetail from './pages/CommunityDetail'
import CommunityWrite from './pages/CommunityWrite'
import JobAIPage from './pages/JobAIPage'
import JobDetailPage from './pages/JobDetailPage'
import CoverLetterManage from './pages/CoverLetterManage'
import CoverLetterWrite from './pages/CoverLetterWrite'
import CoverLetterEdit from './pages/CoverLetterEdit'
import CoverLetterDetail from './pages/CoverLetterDetail'

const router = createBrowserRouter([
  // ── 인증 불필요 (레이아웃 없음) ──────────────────────
  { path: '/login',                  element: <Login /> },
  { path: '/signup',                 element: <Signup /> },
  { path: '/oauth/kakao/callback',   element: <KakaoCallback /> },

  // ── 레이아웃 포함 경로 ────────────────────────────────
  {
    element: <Layout />,
    children: [
      { path: '/',              element: <HomePage /> },
      { path: '/mypage',        element: <PrivateRoute><MyPage /></PrivateRoute> },
      { path: '/contract/upload', element: <PrivateRoute><ContractUploadPage /></PrivateRoute> },
      { path: '/contract/result/:id', element: <PrivateRoute><ContractResultPage /></PrivateRoute> },
      { path: '/jobs',          element: <JobListPage /> },
      { path: '/jobs/:id',      element: <JobDetailPage /> },
      { path: '/jobs/:id/ai',   element: <PrivateRoute><JobAIPage /></PrivateRoute> },
      { path: '/chatbot',              element: <CoverLetterManage /> },
      { path: '/cover-letter',         element: <CoverLetterManage /> },
      { path: '/cover-letter/write',   element: <CoverLetterWrite /> },
      { path: '/cover-letter/edit/:id', element: <CoverLetterEdit /> },
      { path: '/cover-letter/:id',     element: <CoverLetterDetail /> },
      { path: '/info',          element: <InfoListPage /> },
      { path: '/info/:id',      element: <InfoDetailPage /> },
      { path: '/community',     element: <Community /> },
      { path: '/community/write', element: <CommunityWrite /> },
      { path: '/community/:id', element: <CommunityDetail /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}