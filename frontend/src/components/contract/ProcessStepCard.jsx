export default function ProcessStepCard({ step, title, description, icon }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col gap-4">
      <span className="text-sm font-medium text-gray-300">{step}</span>
      <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-gray-800 mb-1.5">{title}</h3>
        <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}