import { useNavigate } from 'react-router-dom'

export default function InfoSummaryCard({ info }) {
  const navigate = useNavigate()

  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col gap-3 cursor-pointer hover:-translate-y-1 transition-transform duration-200"
      onClick={() => navigate(`/info/${info.id}`)}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
          AI 요약
        </span>
        <span className="text-xs text-gray-400">{info.createdAt}</span>
      </div>

      <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">
        {info.title}
      </h4>

      {info.subTitle && (
        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
          {info.subTitle}
        </p>
      )}

      {info.aiSummary3lines && (
        <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed border-t border-gray-50 pt-3">
          {info.aiSummary3lines}
        </p>
      )}
    </div>
  )
}
