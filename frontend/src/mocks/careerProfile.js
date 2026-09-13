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
  recentMatch: '분석 결과 없음',
  skillGap: '-',
  nextStep: '준비 중',
  applicationStatus: '준비 중',
  deadlines: '준비 중',
}
