const STYLES = {
  HIGH: 'bg-red-50 text-red-500 border-red-200',
  MEDIUM: 'bg-orange-50 text-orange-500 border-orange-200',
  LOW: 'bg-green-50 text-green-600 border-green-200',
}

const LABELS = {
  HIGH: '고위험',
  MEDIUM: '중간위험',
  LOW: '저위험',
}

export default function RiskBadge({ level }) {
  return (
    <span
      className={`shrink-0 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${STYLES[level]}`}
    >
      {LABELS[level]}
    </span>
  )
}