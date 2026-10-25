export default function SummaryCard({ label, value, note }) {
  return (
    <div className="min-w-0 break-keep">
      <p className="text-xs text-gray-400 mb-1.5 break-keep">{label}</p>
      <p className="text-xl font-bold text-gray-900 mb-1 leading-tight break-keep">{value}</p>
      <p className="text-xs text-gray-400 break-keep">{note}</p>
    </div>
  )
}