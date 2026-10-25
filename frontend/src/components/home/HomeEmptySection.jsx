import { Link } from 'react-router-dom'
import { Inbox } from 'lucide-react'

export default function HomeEmptySection({ message, description, actionLabel, actionPath }) {
  return (
    <div className="border-2 border-dashed border-gray-200 rounded-xl min-h-52 flex flex-col items-center justify-center gap-2 py-12">
      <Inbox className="w-9 h-9 text-gray-300 mb-1" />
      <p className="text-sm font-medium text-gray-600">{message}</p>
      {description && (
        <p className="text-xs text-gray-400">{description}</p>
      )}
      <Link
        to={actionPath}
        className="mt-3 px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
      >
        {actionLabel}
      </Link>
    </div>
  )
}
