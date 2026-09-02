import axiosInstance from './axiosInstance'
import {
  mockLocalUser,
  mockKakaoUser,
  mockActivityCount,
  mockBookmarkedPostings,
  mockAIAnalysisPostings,
  mockFavoritePosts,
} from '../mocks/mypage'

const USE_MOCK = false
const MOCK_PROVIDER = 'LOCAL' // 'LOCAL' | 'KAKAO' — 카카오 사용자 화면 테스트 시 'KAKAO'로 변경

export async function getCurrentUser() {
  if (USE_MOCK) return MOCK_PROVIDER === 'KAKAO' ? mockKakaoUser : mockLocalUser
  // TODO: GET /users/me
  const { data } = await axiosInstance.get('/users/me')
  return data
}

export async function getUserActivityCount() {
  if (USE_MOCK) return mockActivityCount
  // TODO: GET /users/me/activity
  const { data } = await axiosInstance.get('/users/me/activity')
  return data
}

export async function getBookmarkedPostings() {
  if (USE_MOCK) return mockBookmarkedPostings
  // TODO: GET /users/me/bookmarks
  const { data } = await axiosInstance.get('/users/me/bookmarks')
  return data
}

export async function getAIAnalysisPostings() {
  if (USE_MOCK) return mockAIAnalysisPostings
  // TODO: GET /users/me/ai-analyses
  const { data } = await axiosInstance.get('/users/me/ai-analyses')
  return data
}

export async function getFavoritePosts() {
  if (USE_MOCK) return mockFavoritePosts
  // TODO: GET /users/me/favorites
  const { data } = await axiosInstance.get('/users/me/favorites')
  return data
}

export async function updateUser(payload) {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 600))
    const baseUser = MOCK_PROVIDER === 'KAKAO' ? mockKakaoUser : mockLocalUser
    return { ...baseUser, ...payload }
  }
  // TODO: PATCH /users/me
  const { data } = await axiosInstance.patch('/users/me', payload)
  return data
}

export async function uploadProfileImage(file) {
  if (USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const reader = new FileReader()
        reader.onload = (ev) => resolve({ profileImage: ev.target.result })
        reader.readAsDataURL(file)
      }, 500)
    })
  }
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await axiosInstance.post(
    '/users/me/profile-image',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )
  return data
}

export async function deleteProfileImage() {
  if (USE_MOCK) {
    return { success: true }
  }
  await axiosInstance.delete('/users/me/profile-image')
}

export async function changePassword(payload) {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 400))
    return
  }
  // TODO: POST /users/me/password
  await axiosInstance.post('/users/me/password', payload)
}

const BLOCKED_NICKNAMES = ['admin', 'test', '취업도전자']

export async function checkNicknameDuplicate(nickname) {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 350))
    return { available: !BLOCKED_NICKNAMES.includes(nickname) }
  }
  // TODO: GET /users/check-nickname?nickname={nickname}
  const { data } = await axiosInstance.get(
    '/users/check-nickname',
    { params: { nickname } },
  )
  return { available: !data.duplicate }
}