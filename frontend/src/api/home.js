import axiosInstance from './axiosInstance'

export function getPromotionBanner() {
  return Promise.resolve({
    badge: 'NEW',
    title: '취업 준비의 모든 것\nNextStep과 함께',
    subtitle: 'AI 기반 채용 정보, 자소서 첨삭, 계약서 분석까지',
  })
}

export async function getLatestPostings() {
  const { data } = await axiosInstance.get('/jobs', {
    params: { page: 0, size: 4, sort: '최신순' },
  })
  return data.content.map((job) => ({
    postingId: job.id,
    title: job.title,
    companyName: job.org,
    location: job.workLocation,
    status: job.status,
    endDate: job.end,
    employmentType: job.employmentType,
  }))
}

export async function getAISummaryPostings() {
  const { data } = await axiosInstance.get('/users/me/ai-analyses')
  return data
}

export async function getLatestInfo() {
  const { data } = await axiosInstance.get('/latest-info', {
    params: { page: 0, size: 3 },
  })
  return data.content
}
