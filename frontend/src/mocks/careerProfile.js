export const PROFICIENCY_OPTIONS = ['입문', '초급', '중급', '고급']

export const INITIAL_SKILLS = [
  { id: 1, name: 'React', proficiency: '중급' },
  { id: 2, name: 'JavaScript', proficiency: '중급' },
  { id: 3, name: 'Git', proficiency: '초급' },
]

export const INITIAL_PROJECTS = [
  {
    id: 1,
    name: 'Next Step',
    role: '프론트엔드 개발',
    technologies: 'React, Tailwind CSS, Git',
    description: '취업 준비생을 위한 채용·근로계약서 지원 서비스 화면을 구현했습니다.',
  },
]

export const CAREER_PLACEHOLDERS = {
  recentMatch: '78%',
  skillGap: 'Docker, Redis',
  nextStep: 'Docker 배포 경험을 기존 프로젝트에 추가해보기',
  applicationStatus: '지원 3곳 · 서류합격 1곳',
  deadlines: 'D-3 (B기업 서류 마감)',
}
