export default function PlaceholderPage({ title }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-lg font-medium text-gray-700">{title} 페이지는 다른 팀원이 작업 중입니다.</p>
        <p className="text-sm text-gray-400 mt-2">잠시 후 다시 확인해주세요.</p>
      </div>
    </div>
  )
}