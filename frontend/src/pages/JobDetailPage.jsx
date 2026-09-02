import '../App.css'
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import JobDetail from '../JobDetail'
import { getToken } from '../utils/authUtils'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080'

export default function JobDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [bookmarked, setBookmarked] = useState(null) // null = 아직 조회 전

  useEffect(() => {
    const token = getToken()
    if (!token) { setBookmarked(false); return }
    fetch(`${API_BASE}/api/v1/jobs/${id}/bookmark`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => setBookmarked(data.bookmarked))
      .catch(() => setBookmarked(false))
  }, [id])

  // 북마크 상태 조회 전에는 렌더링 보류 (JobDetail의 useState 초기값이 한 번만 적용되므로)
  if (bookmarked === null) return null

  return (
    <div className="main">
      <JobDetail job={{ id: Number(id), bookmarked }} onBack={() => navigate(-1)} />
    </div>
  )
}
