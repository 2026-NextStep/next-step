import axiosInstance from './axiosInstance'

export async function signup(data) {
  const { data: result } = await axiosInstance.post('/auth/signup', data)
  return result
}

export async function login(data) {
  const { data: result } = await axiosInstance.post('/auth/login', data)
  return result
}

export async function kakaoLogin(code) {
  const { data: result } = await axiosInstance.post('/auth/kakao', { code })
  return result
}

export async function sendEmailCode(email) {
  const { data: result } = await axiosInstance.post('/email/send', { email })
  return result
}

export async function verifyEmailCode(email, code) {
  const { data: result } = await axiosInstance.post('/email/verify', { email, code })
  return result
}