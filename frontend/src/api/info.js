import axiosInstance from './axiosInstance'

/** 희망직무 기반 맞춤 소식 — { nickname, desiredJob, items: [{ id, title, ..., reason }] } */
export async function getRecommendedInfo() {
  const { data } = await axiosInstance.get('/latest-info/recommended')
  return data
}

/** 최신정보 상세에 붙는 관련 채용공고 — [{ job: JobPostingDto, reason }] */
export async function getRelatedJobs(infoId, limit = 4) {
  const { data } = await axiosInstance.get(`/latest-info/${infoId}/related-jobs`, {
    params: { limit },
  })
  return data
}
