import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { isLoggedIn } from '../utils/authUtils'
import {
  getPromotionBanner,
  getLatestPostings,
  getAISummaryPostings,
  getLatestInfo,
} from '../api/home'
import PromotionBanner from '../components/home/PromotionBanner'
import JobPostingCard from '../components/home/JobPostingCard'
import BookmarkedJobCard from '../components/mypage/BookmarkedJobCard'
import InfoSummaryCard from '../components/home/InfoSummaryCard'
import SectionHeader from '../components/home/SectionHeader'
import LockedSection from '../components/home/LockedSection'
import HomeEmptySection from '../components/home/HomeEmptySection'

// 비로그인 시 섹션 3 블러용 더미 데이터
const DUMMY_AI_POSTINGS = [
  { postingId: 'd1', title: '소프트웨어 개발자 (신입)', companyName: '한국전력공사', location: '서울', isAlwaysRecruiting: false, dDay: 12, employmentType: '정규직' },
  { postingId: 'd2', title: '데이터 분석가 모집', companyName: '국민건강보험공단', location: '원주', isAlwaysRecruiting: false, dDay: 28, employmentType: '정규직' },
  { postingId: 'd3', title: '디지털 콘텐츠 기획자', companyName: '문화체육관광부', location: '서울', isAlwaysRecruiting: false, dDay: 3, employmentType: '계약직' },
  { postingId: 'd4', title: 'UX 디자이너 채용', companyName: '한국관광공사', location: '원주', isAlwaysRecruiting: false, dDay: 7, employmentType: '정규직' },
]

// 비로그인 시 섹션 4 블러용 더미 데이터
const DUMMY_INFO = [
  {
    id: 'd1',
    title: '2024 상반기 IT 직군 채용 트렌드 분석',
    subTitle: 'AI·클라우드 분야 채용이 전년 대비 40% 급증',
    aiSummary3lines: 'AI와 클라우드 분야 채용이 급증하고 있습니다. 특히 ML엔지니어와 데이터 사이언티스트 수요가 높습니다. 신입도 AI 관련 프로젝트 경험이 있으면 서류 통과율이 크게 올라갑니다.',
    createdAt: '2024.05.10',
  },
  {
    id: 'd2',
    title: '스타트업 vs 대기업, 사회초년생의 선택은?',
    subTitle: '성장 가능성과 안정성 사이에서의 고민',
    aiSummary3lines: '스타트업은 빠른 성장과 다양한 경험을 제공합니다. 대기업은 안정성과 체계적인 교육 환경을 갖추고 있습니다. 직무 목표와 성향에 따라 선택 기준이 달라집니다.',
    createdAt: '2024.05.08',
  },
  {
    id: 'd3',
    title: '신입 공채 합격을 위한 자소서 핵심 전략',
    subTitle: '인사 담당자가 주목하는 자소서 키워드 분석',
    aiSummary3lines: '경험의 구체성, 직무 연관성, 성과 수치화가 합격 자소서의 3대 요소입니다. 불필요한 미사여구보다 실질적인 경험 기술이 더 높은 평가를 받습니다.',
    createdAt: '2024.05.06',
  },
]

export default function HomePage() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [loggedIn, setLoggedIn] = useState(() => isLoggedIn())

  const [banner, setBanner] = useState(null)
  const [latestPostings, setLatestPostings] = useState([])
  const [aiPostings, setAiPostings] = useState([])
  const [latestInfo, setLatestInfo] = useState([])
  const [loading, setLoading] = useState(true)

  // 경로 변경 시 로그인 상태 재확인
  useEffect(() => {
    setLoggedIn(isLoggedIn())
  }, [pathname])

  // 같은 페이지에서 로그아웃 시 즉시 반영 (pathname 변화 없는 경우 대응)
  useEffect(() => {
    const handler = () => setLoggedIn(isLoggedIn())
    window.addEventListener('nextstep:logout', handler)
    return () => window.removeEventListener('nextstep:logout', handler)
  }, [])

  // loggedIn 변경 시 데이터 재요청
  useEffect(() => {
    setLoading(true)
    const always = [
      getPromotionBanner().then(setBanner).catch(() => {}),
      getLatestPostings().then(setLatestPostings).catch(() => setLatestPostings([])),
    ]
    const whenLoggedIn = loggedIn
      ? [
          getAISummaryPostings().then(setAiPostings).catch(() => setAiPostings([])),
          getLatestInfo().then(setLatestInfo).catch(() => setLatestInfo([])),
        ]
      : []

    Promise.all([...always, ...whenLoggedIn]).finally(() => setLoading(false))
  }, [loggedIn])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-gray-400">불러오는 중...</p>
      </div>
    )
  }

  return (
    <div>

      {/* ── 영역 1: 프로모션 배너 ─────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 pt-8 pb-14">
        {banner && <PromotionBanner banner={banner} />}
      </div>

      {/* ── 영역 2: 최신 채용 공고 ────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 pb-16">
        <SectionHeader title="최신 채용 공고" linkTo="/jobs" />
        {latestPostings.length === 0 ? (
          <p className="py-16 text-center text-sm text-gray-400">채용 공고를 불러올 수 없어요.</p>
        ) : (
          <div className="grid grid-cols-4 gap-5">
            {latestPostings.map((p, i) => (
              <JobPostingCard key={p.postingId} posting={p} index={i} />
            ))}
          </div>
        )}
      </div>

      {/* ── 영역 3: 나만의 AI 요약 공고 (회색 배경) ──────── */}
      <div className="bg-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeader title="나만의 AI 요약 공고" linkTo="/mypage" />
          {loggedIn ? (
            aiPostings.length > 0 ? (
              <div className="grid grid-cols-4 gap-5">
                {aiPostings.map((p) => (
                  <BookmarkedJobCard
                    key={p.postingId}
                    posting={p}
                    showBookmark={false}
                    onClick={() => navigate(`/jobs/${p.postingId}/ai`)}
                  />
                ))}
              </div>
            ) : (
              <HomeEmptySection
                message="아직 AI 분석을 요청한 공고가 없어요"
                description="채용 공고 상세 페이지에서 AI 분석을 받아보세요"
                actionLabel="채용 공고 보러 가기"
                actionPath="/jobs"
              />
            )
          ) : (
            <LockedSection>
              <div className="grid grid-cols-4 gap-5">
                {DUMMY_AI_POSTINGS.map((p) => (
                  <BookmarkedJobCard key={p.postingId} posting={p} showBookmark={false} />
                ))}
              </div>
            </LockedSection>
          )}
        </div>
      </div>

      {/* ── 영역 4: 최신 직업/기업 정보 AI 요약 ──────────── */}
      <div className="max-w-7xl mx-auto px-6 py-16 pb-24">
        <SectionHeader title="최신 직업/기업 정보 AI 요약" linkTo="/info" />
        {loggedIn ? (
          latestInfo.length > 0 ? (
            <div className="grid grid-cols-3 gap-4">
              {latestInfo.map((info) => (
                <InfoSummaryCard key={info.id} info={info} />
              ))}
            </div>
          ) : (
            <HomeEmptySection
              message="최신 취업 정보를 불러올 수 없어요"
              actionLabel="취업 정보 보러 가기"
              actionPath="/info"
            />
          )
        ) : (
          <LockedSection>
            <div className="grid grid-cols-3 gap-4">
              {DUMMY_INFO.map((info, i) => (
                <InfoSummaryCard key={i} info={info} />
              ))}
            </div>
          </LockedSection>
        )}
      </div>

    </div>
  )
}
