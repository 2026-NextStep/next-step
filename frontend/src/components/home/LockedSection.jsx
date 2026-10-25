import { Link } from 'react-router-dom'
import { Lock } from 'lucide-react'

export default function LockedSection({ children, message = '로그인 후 이용 가능합니다' }) {
  return (
    <div className="relative">
      <div className="filter blur-sm pointer-events-none select-none">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/40 backdrop-blur-sm rounded-xl">
        <Lock className="w-10 h-10 text-gray-500 mb-3" />
        <p className="text-base font-medium text-gray-800 mb-4">{message}</p>
        <Link
          to="/login"
          className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          로그인하기
        </Link>
      </div>
    </div>
  )
}
