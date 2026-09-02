// axiosInstance baseURL에서 백엔드 origin 추출 (하드코딩 없이)
const apiBase = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api/v1'
const BACKEND_ORIGIN = new URL(apiBase).origin   // "http://localhost:8080"

/**
 * 백엔드에서 내려오는 상대 경로(/uploads/...)를 브라우저에서 접근 가능한
 * 절대 URL(http://localhost:8080/uploads/...)로 변환.
 * 이미 절대 URL이면 그대로 반환.
 */
export function toImageUrl(path) {
  if (!path) return null
  if (path.startsWith('http')) return path
  return BACKEND_ORIGIN + path
}