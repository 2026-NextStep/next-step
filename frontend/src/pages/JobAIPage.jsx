import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AIAnalysis from '../AIAnalysis'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080'

export default function JobAIPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [detail, setDetail] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch(`${API_BASE}/api/v1/jobs/${id}`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then(d => setDetail(d))
      .catch(() => setError('공고 정보를 불러올 수 없습니다.'))
  }, [id])

  if (error) return (
    <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
      <p style={{ marginBottom: '16px' }}>{error}</p>
      <button
        onClick={() => navigate('/jobs')}
        style={{ color: '#6366f1', textDecoration: 'underline', cursor: 'pointer' }}
      >
        채용공고 목록으로
      </button>
    </div>
  )

  if (!detail) return (
    <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
      불러오는 중...
    </div>
  )

  return <AIAnalysis detail={detail} onBack={() => navigate(-1)} />
}
