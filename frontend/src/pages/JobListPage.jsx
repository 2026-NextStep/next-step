import { useState, useEffect } from 'react'
import '../App.css'
import JobDetail from '../JobDetail'
import { getToken } from '../utils/authUtils'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080'
const PAGE_SIZE = 10
const QUICK_FILTERS = ['전체 기관', '체험형 인턴', '정규직', '오늘 마감', 'D-7 이내']
const SORT_OPTIONS = ['최신순', '마감일순', '조회수순']

function shortLoc(loc) {
  if (!loc) return '-'
  const parts = loc.split(',')
  if (parts.length <= 2) return loc
  return `${parts[0]},${parts[1]} 외 ${parts.length - 2}`
}

export default function JobListPage() {
  const [searchText, setSearchText]         = useState('')
  const [appliedSearch, setAppliedSearch]   = useState('')
  const [employment, setEmployment]         = useState('')
  const [region, setRegion]                 = useState('')
  const [progressStatus, setProgressStatus] = useState('')
  const [activeFilter, setActiveFilter]     = useState('전체 기관')
  const [sortBy, setSortBy]                 = useState('최신순')
  const [currentPage, setCurrentPage]       = useState(1)
  const [jobs, setJobs]                     = useState([])
  const [selectedJob, setSelectedJob]       = useState(null)
  const [totalCount, setTotalCount]         = useState(0)
  const [totalPages, setTotalPages]         = useState(1)
  const [loading, setLoading]               = useState(true)
  const [error, setError]                   = useState(null)
  const [filters, setFilters]               = useState({ employmentTypes: [], regions: [] })

  useEffect(() => {
    fetch(`${API_BASE}/api/v1/jobs/filters`)
      .then(r => r.json())
      .then(setFilters)
      .catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    setError(null)
    const params = new URLSearchParams({
      page: currentPage - 1,
      size: PAGE_SIZE,
      search: appliedSearch,
      employment,
      region,
      status: progressStatus,
      quickFilter: activeFilter === '전체 기관' ? '' : activeFilter,
      sort: sortBy,
    })
    const token = getToken()
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {}
    fetch(`${API_BASE}/api/v1/jobs?${params}`, { headers })
      .then(res => {
        if (!res.ok) throw new Error('서버 오류')
        return res.json()
      })
      .then(data => {
        setJobs(data.content)
        setTotalCount(data.totalElements)
        setTotalPages(data.totalPages)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [currentPage, appliedSearch, employment, region, progressStatus, activeFilter, sortBy])

  const handleSearch = () => {
    setCurrentPage(1)
    setAppliedSearch(searchText)
  }

  const handleFilterChange = (setter) => (val) => {
    setter(val)
    setCurrentPage(1)
  }

  const toggleBookmark = async (id) => {
    const token = getToken()
    if (!token) { alert('로그인이 필요합니다.'); return }
    try {
      const res = await fetch(`${API_BASE}/api/v1/jobs/${id}/bookmark`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setJobs(prev => prev.map(j => j.id === id ? { ...j, bookmarked: data.bookmarked } : j))
    } catch {
      alert('북마크 처리 중 오류가 발생했습니다.')
    }
  }

  const pageNumbers = (() => {
    if (totalPages <= 9) return Array.from({ length: totalPages }, (_, i) => i + 1)
    if (currentPage <= 5) return [1, 2, 3, 4, 5, 6, 7, '...', totalPages]
    if (currentPage >= totalPages - 4) return [1, '...', totalPages - 6, totalPages - 5, totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    return [1, '...', currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2, '...', totalPages]
  })()

  return (
    <div className="app">
      <main className="main">
        {selectedJob ? (
          <JobDetail job={selectedJob} onBack={() => setSelectedJob(null)} />
        ) : (
          <>
            <div className="breadcrumb">
              <span>홈</span>
              <span className="breadcrumb-sep">›</span>
              <span>공고 목록 조회</span>
            </div>

            <div className="page-title-row">
              <h1 className="page-title">공공기관 채용공고 목록 조회</h1>
              <div className="title-badges">
                <span className="badge badge-total">총 {totalCount.toLocaleString()}건</span>
              </div>
            </div>

            <div className="search-box">
              <div className="search-row">
                <div className="search-input-wrap">
                  <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                  </svg>
                  <input className="search-input" placeholder="기관명, 공고명, 채용분야로 검색"
                    value={searchText} onChange={e => setSearchText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()} />
                </div>
                <select className="filter-select" value={employment} onChange={e => handleFilterChange(setEmployment)(e.target.value)}>
                  <option value="">고용형태</option>
                  {filters.employmentTypes.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <select className="filter-select" value={region} onChange={e => handleFilterChange(setRegion)(e.target.value)}>
                  <option value="">지역</option>
                  {filters.regions.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <select className="filter-select" value={progressStatus} onChange={e => handleFilterChange(setProgressStatus)(e.target.value)}>
                  <option value="">진행상태</option>
                  <option value="접수중">접수중</option>
                  <option value="마감임박">마감임박</option>
                  <option value="마감">마감</option>
                </select>
                <button className="search-btn" onClick={handleSearch}>검색</button>
              </div>
              <div className="quick-filters">
                {QUICK_FILTERS.map(f => (
                  <button key={f} className={`chip ${activeFilter === f ? 'chip-active' : ''}`}
                    onClick={() => handleFilterChange(setActiveFilter)(f)}>{f}</button>
                ))}
              </div>
            </div>

            <div className="results-header">
              <span className="results-count">결과 <strong>{totalCount.toLocaleString()}건</strong></span>
              <div className="sort-btns">
                {SORT_OPTIONS.map(s => (
                  <button key={s} className={`sort-btn ${sortBy === s ? 'sort-btn-active' : ''}`}
                    onClick={() => handleFilterChange(setSortBy)(s)}>{s}</button>
                ))}
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>불러오는 중...</div>
            ) : error ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#ef4444' }}>
                데이터를 불러올 수 없습니다. Spring Boot 서버가 실행 중인지 확인해주세요.
              </div>
            ) : jobs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>검색 결과가 없습니다.</div>
            ) : (
              <div className="table-wrap">
                <table className="job-table">
                  <thead>
                    <tr>
                      <th>상태</th><th>공고명</th><th>기관명</th>
                      <th>채용분야</th><th>접수기간</th><th>스크랩수</th><th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map(job => (
                      <tr key={job.id} className="job-row" onClick={() => {
                          fetch(`${API_BASE}/api/v1/jobs/${job.id}/view`, { method: 'PATCH' })
                          setSelectedJob(job)
                        }}>
                        <td>
                          <span className={`status-badge ${job.status === '마감임박' ? 'status-urgent' : job.status === '마감' ? 'status-closed' : 'status-open'}`}>
                            {job.status}
                          </span>
                        </td>
                        <td className="job-title-cell">
                          <div className="job-title">{job.title}</div>
                          <div className="job-meta">{job.employmentType || '-'} · {shortLoc(job.workLocation)}</div>
                        </td>
                        <td className="org-cell">{job.org}</td>
                        <td className="field-cell">{shortLoc(job.field)}</td>
                        <td className="date-cell">{job.start} ~<br />{job.end}</td>
                        <td className="views-cell">{(job.views || 0).toLocaleString()}</td>
                        <td>
                          <button className={`bookmark-btn ${job.bookmarked ? 'bookmarked' : ''}`}
                            onClick={e => { e.stopPropagation(); toggleBookmark(job.id) }} aria-label="북마크">
                            <svg width="18" height="18" viewBox="0 0 24 24"
                              fill={job.bookmarked ? '#3b82f6' : 'none'}
                              stroke={job.bookmarked ? '#3b82f6' : '#ccc'} strokeWidth="2">
                              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="pagination">
              <button className="page-btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>이전</button>
              {pageNumbers.map((p, i) =>
                p === '...'
                  ? <span key={`e${i}`} className="page-ellipsis">...</span>
                  : <button key={p} className={`page-btn ${currentPage === p ? 'page-btn-active' : ''}`}
                      onClick={() => setCurrentPage(p)}>{p}</button>
              )}
              <button className="page-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>다음</button>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
