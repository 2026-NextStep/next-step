import { ArrowRight, BriefcaseBusiness, CalendarDays, FolderKanban, Route, Target, Wrench } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { CAREER_PLACEHOLDERS, INITIAL_PROJECTS, INITIAL_SKILLS } from '../../mocks/careerProfile'

function StatusCard({ icon: Icon, title, value, description }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-4">
      <div className="mb-3 flex items-center gap-2 text-gray-500">
        <Icon size={16} />
        <span className="text-xs font-medium">{title}</span>
      </div>
      <p className="text-base font-bold text-gray-900">{value}</p>
      {description && <p className="mt-1 text-xs text-gray-400">{description}</p>}
    </div>
  )
}

function ManageCard({ title, count, items, buttonLabel, onClick }) {
  return (
    <div className="rounded-xl border border-gray-100 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-gray-900">{title}</p>
          <p className="mt-1 text-xs text-gray-400">등록된 항목 {count}개</p>
        </div>
        <button
          type="button"
          onClick={onClick}
          className="flex shrink-0 items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
        >
          {buttonLabel}<ArrowRight size={14} />
        </button>
      </div>
      <div className="mt-4 flex min-h-8 flex-wrap gap-2">
        {items.length > 0 ? items.map((item) => (
          <span key={item} className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600">
            {item}
          </span>
        )) : <span className="text-sm text-gray-400">등록된 정보가 없습니다.</span>}
      </div>
    </div>
  )
}

export default function CareerDashboardSection({ desiredJob, bookmarkCount }) {
  const navigate = useNavigate()

  return (
    <div id="career-dashboard" className="scroll-mt-20 rounded-2xl bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">취업 준비 현황</h2>
          <p className="mt-1 text-sm text-gray-400">등록한 경험을 바탕으로 준비 상황을 확인하는 공간입니다.</p>
        </div>
        <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500">UI 미리보기</span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatusCard icon={BriefcaseBusiness} title="희망 직무" value={desiredJob || '-'} />
        <StatusCard icon={Target} title="최근 공고 적합도" value={CAREER_PLACEHOLDERS.recentMatch} />
        <StatusCard icon={Wrench} title="부족 역량" value={CAREER_PLACEHOLDERS.skillGap} description="공고 분석 연동 예정" />
        <StatusCard icon={Route} title="이번 주 Next Step" value={CAREER_PLACEHOLDERS.nextStep} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ManageCard
          title="보유 역량"
          count={INITIAL_SKILLS.length}
          items={INITIAL_SKILLS.map((skill) => skill.name)}
          buttonLabel="역량 관리"
          onClick={() => navigate('/mypage/skills')}
        />
        <ManageCard
          title="프로젝트 경험"
          count={INITIAL_PROJECTS.length}
          items={INITIAL_PROJECTS.map((project) => project.name)}
          buttonLabel="경험 관리"
          onClick={() => navigate('/mypage/projects')}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        <StatusCard
          icon={BriefcaseBusiness}
          title="관심 공고 / 지원 현황"
          value={`관심 공고 ${bookmarkCount}개 · 지원 ${CAREER_PLACEHOLDERS.applicationStatus}`}
        />
        <StatusCard icon={CalendarDays} title="채용 마감 일정" value={CAREER_PLACEHOLDERS.deadlines} />
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-3 text-xs text-blue-600">
        <FolderKanban size={15} />
        적합도와 부족 역량은 향후 채용공고 분석 API 연결 후 제공됩니다.
      </div>
    </div>
  )
}
