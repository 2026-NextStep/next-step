import { forwardRef } from 'react'
import LocalUserProfile from './LocalUserProfile'
import KakaoUserProfile from './KakaoUserProfile'

const BasicInfoCard = forwardRef(function BasicInfoCard({ user }, ref) {
  if (user.provider === 'kakao') {
    return <KakaoUserProfile ref={ref} user={user} />
  }
  return <LocalUserProfile ref={ref} user={user} />
})

export default BasicInfoCard