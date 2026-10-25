import axios from 'axios'
import { getToken, clearAuth } from '../utils/authUtils'

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api/v1',
  timeout: 90000,
  headers: { 'Content-Type': 'application/json' },
})

// 요청 인터셉터 — localStorage/sessionStorage 모두 확인 후 Authorization 헤더 첨부
axiosInstance.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

// 응답 인터셉터 — 401 수신 시 모든 인증 정보 제거 후 로그인 페이지로 이동, 500은 콘솔에 기록
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    if (status === 401 && window.location.pathname !== '/login') {
      clearAuth()
      window.location.href = '/login'
    } else if (status >= 500) {
      console.error(`[API 서버 오류] ${error.config?.method?.toUpperCase()} ${error.config?.url}`, error.response?.data)
    }
    return Promise.reject(error)
  }
)

export default axiosInstance