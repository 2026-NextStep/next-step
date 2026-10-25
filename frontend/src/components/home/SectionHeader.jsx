import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

export default function SectionHeader({ title, linkTo }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      <Link
        to={linkTo}
        className="flex items-center gap-0.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
      >
        전체보기
        <ChevronRight size={14} />
      </Link>
    </div>
  )
}