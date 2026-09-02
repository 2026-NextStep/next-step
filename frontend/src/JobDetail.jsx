import { useState, useEffect } from 'react'
import './JobDetail.css'
import AIAnalysis from './AIAnalysis'
import { getToken } from './utils/authUtils'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080'

export default function JobDetail({ job, onBack }) {
  const [detail, setDetail]     = useState(null)
  const [loading, setLoading]   = useState(true)
  const [bookmarked, setBookmarked] = useState(job.bookmarked || false)
  const [showAI, setShowAI]     = useState(false)
  const [aiData, setAiData]     = useState(null)

  useEffect(() => {
    setLoading(true)
    fetch(`${API_BASE}/api/v1/jobs/${job.id}`)
      .then(r => r.json())
      .then(d => { setDetail(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [job.id])

  const toggleBookmark = async () => {
    const token = getToken()
    if (!token) { alert('로그인이 필요합니다.'); return }
    try {
      const res = await fetch(`${API_BASE}/api/v1/jobs/${detail.id}/bookmark`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setBookmarked(data.bookmarked)
    } catch {
      alert('북마크 처리 중 오류가 발생했습니다.')
    }
  }

  useEffect(() => {
    if (!detail?.id) return
    fetch(`${API_BASE}/api/v1/jobs/${detail.id}/ai-analysis`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setAiData(data) })
      .catch(() => {})
  }, [detail?.id])

  if (showAI) return <AIAnalysis detail={detail} preloadedData={aiData} onBack={() => setShowAI(false)} />
  if (loading) return <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>불러오는 중...</div>

  const d = detail || {}

  const qualItems   = d.qualificationItems ? JSON.parse(d.qualificationItems) : []
  const positions   = d.recruitPositions   ? JSON.parse(d.recruitPositions)   : null
  const stepsArr    = d.selectionSteps     ? JSON.parse(d.selectionSteps)     : []

  const qualList    = qualItems.filter(q => q.type !== '전형방법')
  const processText = qualItems.find(q => q.type === '전형방법')?.content || ''

  const ncsFields  = positions?.ncs_fields  || []
  const totalCount = positions?.total_count || 0

  const endDate = d.end ? new Date(d.end.replace(/\./g, '-')) : null
  const dDay    = endDate ? Math.ceil((endDate - new Date()) / 86400000) : null
  const dLabel  = dDay === null ? '-' : dDay > 0 ? `D-${dDay}` : dDay === 0 ? 'D-Day' : '마감'

  return (
    <div className="det-wrap">

      <nav className="det-bc">
        <span>홈</span>
        <span className="det-bc-sep">›</span>
        <button className="det-bc-btn" onClick={onBack}>공고 목록 조회</button>
        <span className="det-bc-sep">›</span>
        <span>공고 상세</span>
      </nav>

      <p className="det-company">{d.org}</p>
      <h1 className="det-title">{d.title}</h1>
      <div className="det-tags">
        <span className={`det-tag det-tag-status`}>{d.status}</span>
        {d.employmentType && <span className="det-tag">{d.employmentType}</span>}
        {d.recruitType    && <span className="det-tag">{d.recruitType}</span>}
        {d.workLocation   && <span className="det-tag">{d.workLocation}</span>}
      </div>

      <div className="det-layout">

        <div className="det-main">

          <section className="det-section">
            <div className="det-sec-head">
              <h2 className="det-sec-title">기본 정보</h2>
              <button className="det-ai-btn" onClick={() => setShowAI(true)}>AI 요약/분석</button>
            </div>
            <hr className="det-hr" />
            <table className="det-info-tbl">
              <tbody>
                <tr>
                  <th>고용형태</th>
                  <td>{d.employmentType || '-'}</td>
                  <th>채용구분</th>
                  <td>{d.recruitType || '-'}</td>
                </tr>
                <tr>
                  <th>근무지역</th>
                  <td>{d.workLocation || '-'}</td>
                  <th>채용인원</th>
                  <td>{d.recruitCount ? `${d.recruitCount}명` : '-'}</td>
                </tr>
                <tr>
                  <th>접수기간</th>
                  <td className="det-val-bold">{d.start} ~ {d.end}</td>
                  <th>학력조건</th>
                  <td>{d.education || '-'}</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section className="det-section">
            <div className="det-sec-head">
              <h2 className="det-sec-title">모집분야 및 인원</h2>
            </div>
            <hr className="det-hr" />
            <table className="det-field-tbl">
              <thead>
                <tr>
                  <th>채용분야</th>
                  <th>직무내용</th>
                  <th>채용인원</th>
                  <th>주요근무지</th>
                </tr>
              </thead>
              <tbody>
                {(ncsFields.length > 0 ? ncsFields : [d.field || '-']).map((field, i) => (
                  <tr key={i}>
                    <td className="det-fa">{field}</td>
                    <td className="det-fd">{field} 관련 업무</td>
                    <td className="det-fc">{i === 0 ? (totalCount > 0 ? `${totalCount}명` : '-') : ''}</td>
                    <td className="det-fl">{i === 0 ? (d.workLocation || '-') : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="det-section">
            <div className="det-sec-head">
              <h2 className="det-sec-title">지원 자격</h2>
            </div>
            <hr className="det-hr" />
            {qualList.length > 0 ? (
              <ul className="det-qual-list">
                {qualList.map((q, i) => (
                  <li key={i} className="det-qual-item">
                    <svg className="det-qual-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="#3b82f6" strokeWidth="1.8"/>
                      <path d="M7.5 12l3 3 6-6" stroke="#3b82f6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>
                      <strong className="det-ql">{q.type}</strong>
                      {'  '}
                      <span style={{ whiteSpace: 'pre-wrap' }}>{q.content}</span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ color: '#6b7280', fontSize: '14px' }}>자격조건 정보가 없습니다.</p>
            )}
          </section>

          <section className="det-section">
            <div className="det-sec-head">
              <h2 className="det-sec-title">전형 절차</h2>
            </div>
            <hr className="det-hr" />
            {processText ? (
              <div className="det-process-raw">{processText}</div>
            ) : stepsArr.length > 0 ? (
              <div className="det-process-raw">{stepsArr.map((s, i) => `${i + 1}. ${s.name || s.stageName || `${i + 1}단계`}`).join('\n')}</div>
            ) : (
              <p style={{ color: '#6b7280', fontSize: '14px' }}>전형 절차 정보가 없습니다.</p>
            )}
          </section>

        </div>

        <aside className="det-sidebar">
          <div className="det-sidebar-card">
            <div className="det-dday-row">
              <span className={`det-dday${dDay !== null && dDay <= 3 ? ' det-dday-red' : ''}`}>{dLabel}</span>
              <span className="det-dday-label">접수 마감까지</span>
            </div>
            <p className="det-period">{d.start} ~ {d.end}</p>
            <button
              className="det-hp-btn"
              onClick={() => d.originalLink && window.open(d.originalLink, '_blank')}
              disabled={!d.originalLink}
            >
              지원 홈페이지 이동
            </button>
            <hr className="det-side-hr" />
            <div className="det-scrap-row">
              <button className="det-scrap-icon-btn" onClick={toggleBookmark}>
                <svg width="20" height="20" viewBox="0 0 24 24"
                  fill={bookmarked ? '#3b82f6' : 'none'}
                  stroke={bookmarked ? '#3b82f6' : '#9ca3af'}
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                </svg>
              </button>
              <div className="det-scrap-info">
                <span className="det-scrap-text">북마크</span>
              </div>
            </div>
          </div>
        </aside>

      </div>
    </div>
  )
}
