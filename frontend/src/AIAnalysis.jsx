import { useEffect, useState } from 'react'
import './AIAnalysis.css'
import axiosInstance from './api/axiosInstance'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080'

export default function AIAnalysis({ detail, preloadedData, onBack }) {
  const [analysis, setAnalysis] = useState(preloadedData || null)
  const [loading, setLoading]   = useState(!preloadedData)
  const [error, setError]       = useState(null)
  const [saved, setSaved]       = useState(false)
  const [saving, setSaving]     = useState(false)

  useEffect(() => {
    if (preloadedData) return
    fetch(`${API_BASE}/api/v1/jobs/${detail.id}/ai-analysis`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then(data => { setAnalysis(data); setLoading(false) })
      .catch(e => { setError(`AI 분석 오류: ${e.message}`); setLoading(false) })
  }, [])

  const handleSave = async () => {
    if (saved || saving) return
    setSaving(true)
    try {
      await axiosInstance.post(`/jobs/${detail.id}/save`)
      setSaved(true)
    } catch {
      alert('저장에 실패했습니다. 로그인 후 다시 시도해주세요.')
    } finally {
      setSaving(false)
    }
  }

  const endDate = detail?.end ? new Date(detail.end.replace(/\./g, '-')) : null
  const dDay    = endDate ? Math.ceil((endDate - new Date()) / 86400000) : null
  const dLabel  = dDay === null ? '-' : dDay > 0 ? `D-${dDay}` : dDay === 0 ? 'D-Day' : '마감'

  const tags = [detail?.status, detail?.employmentType, detail?.recruitType, detail?.workLocation, detail?.education].filter(Boolean)

  if (loading) return (
    <div className="ai-wrap">
      <div className="ai-loading">
        <div className="ai-loading-spinner" />
        <p className="ai-loading-text">AI가 공고를 분석 중입니다...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="ai-wrap">
      <div className="ai-error">
        <p className="ai-error-text">{error}</p>
        <button className="ai-back-link" onClick={onBack}>← 공고 상세로 돌아가기</button>
      </div>
    </div>
  )

  return (
    <div className="ai-wrap">

      <div className="ai-title-row">
        <div>
          <button className="ai-back-link" onClick={onBack}>← 공고 상세로</button>
          <h1 className="ai-title">{detail?.title}</h1>
          <div className="ai-tags">
            {tags.map((t, i) => (
              <span key={i} className={`ai-tag${i === 0 ? ' ai-tag-status' : ''}`}>{t}</span>
            ))}
          </div>
        </div>
        <button
          className="ai-save-btn"
          onClick={handleSave}
          disabled={saving || saved}
          style={{ opacity: saved ? 0.6 : 1 }}
        >
          {saved ? '저장됨' : saving ? '저장 중...' : '저장하기'}
        </button>
      </div>

      <div className="ai-section">
        <div className="ai-sec-head">
          <span className="ai-sec-num">01.</span>
          <span className="ai-sec-title">한눈에 보기</span>
        </div>
        <div className="ai-card">
          <ul className="ai-bullet-list">
            {(analysis.summary || []).map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      </div>

      <div className="ai-section">
        <div className="ai-sec-head">
          <span className="ai-sec-num">02.</span>
          <span className="ai-sec-title">핵심 정보</span>
        </div>
        <div className="ai-card">
          <div className="ai-core-top">
            <p className="ai-core-summary">{analysis.coreSummary}</p>
            {dDay !== null && (
              <div className="ai-dday-box">
                <span className="ai-dday-num">{dLabel}</span>
                <span className="ai-dday-label">마감까지</span>
              </div>
            )}
          </div>
          <div className="ai-core-grid">
            {[
              { label: 'COMPANY',  val: detail?.org,                                        sub: analysis.companySub  },
              { label: 'POSITION', val: analysis.positionTitle || detail?.field || detail?.title, sub: analysis.positionSub  },
              { label: 'LOCATION', val: detail?.workLocation,                               sub: analysis.locationSub },
              { label: 'DEADLINE', val: detail?.end,                                        sub: analysis.deadlineSub },
            ].map((item, i) => (
              <div key={i} className="ai-core-col">
                <span className="ai-core-label">{item.label}</span>
                <span className="ai-core-val">{item.val || '-'}</span>
                {item.sub && <span className="ai-core-sub">{item.sub}</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {analysis.checklist?.length > 0 && (
        <div className="ai-section">
          <div className="ai-sec-head">
            <span className="ai-sec-num">03.</span>
            <span className="ai-sec-title">응시자격 체크리스트</span>
          </div>
          <div className="ai-card">
            <div className="ai-checklist">
              {analysis.checklist.map((group, i) => (
                <div key={i} className="ai-check-group">
                  <span className="ai-check-cat">{group.cat}</span>
                  <ul className="ai-check-items">
                    {(group.items || []).map((cond, j) => (
                      <li key={j} className="ai-check-row">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                          <circle cx="12" cy="12" r="10" fill="#22c55e"/>
                          <path d="M7 12.5l3.5 3.5L17 8" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className="ai-check-cond">{cond}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            {analysis.warningText?.trim() && (
              <div className="ai-warning">
                <span className="ai-warning-icon">⚠</span>
                <p className="ai-warning-text">{analysis.warningText}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {analysis.bonuses?.length > 0 && (
        <div className="ai-section">
          <div className="ai-sec-head">
            <span className="ai-sec-num">04.</span>
            <span className="ai-sec-title">우대 가산점</span>
          </div>
          <div className="ai-bonus-grid">
            {analysis.bonuses.map((item, i) => (
              <div key={i} className="ai-bonus-item">
                <span className="ai-bonus-label">
                  {item.label}
                  {item.sub && <span className="ai-bonus-sub"> {item.sub}</span>}
                </span>
                <span className="ai-bonus-pct">{item.pct}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {analysis.steps?.length > 0 && (
        <div className="ai-section">
          <div className="ai-sec-head">
            <span className="ai-sec-num">05.</span>
            <span className="ai-sec-title">전형 절차</span>
          </div>
          <div className="ai-steps">
            {analysis.steps.map((step, i) => (
              <div key={i} className="ai-step">
                <div className={`ai-step-num${step.done ? ' ai-step-done' : ''}`}>
                  {step.done ? '✓' : i + 1}
                </div>
                <div className="ai-step-body">
                  <div className="ai-step-head">
                    <span className="ai-step-name">{step.name}</span>
                    {step.badge && <span className="ai-step-badge">{step.badge}</span>}
                  </div>
                  {step.desc && <p className="ai-step-desc">{step.desc}</p>}
                  {step.chips?.length > 0 && (
                    <div className="ai-step-chips">
                      {step.chips.map((c, j) => <span key={j} className="ai-chip">{c}</span>)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
