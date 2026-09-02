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

// 응답 인터셉터 — 401 수신 시 모든 인증 정보 제거 후 로그인 페이지로 이동
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuth()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default axiosInstance