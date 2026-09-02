import { useNavigate } from 'react-router-dom'

export default function EmptySection({ icon, title, description, actionLabel, actionPath }) {
  const navigate = useNavigate()

  return (
    <div className="py-10 flex flex-col items-center gap-3">
      <div className="text-gray-300">{icon}</div>
      <div className="text-center">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-xs text-gray-400 mt-1">{description}</p>
      </div>
      {actionLabel && actionPath && (
        <button
          type="button"
          onClick={() => navigate(actionPath)}
          className="mt-2 px-4 py-1.5 text-xs font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
