import { useState, useEffect, useCallback } from 'react'
import StatsStrip from './components/StatsStrip'
import FilterBar from './components/FilterBar'
import JobTable from './components/JobTable'
import BoardView from './components/BoardView'
import JobDrawer from './components/JobDrawer'
import AutoApplyPanel from './components/AutoApplyPanel'
import ResumeView from './components/ResumeView'
import InterviewPrepView from './components/InterviewPrepView'
import LinksView from './components/LinksView'
import SettingsView from './components/SettingsView'
import './App.css'

const API = import.meta.env.VITE_API_URL || ''

function renderTweetBody(html) {
  if (!html) return ''
  const parts = html.split(/(<b>|<\/b>)/g).filter(Boolean)
  let bold = false
  return parts.map((part, i) => {
    if (part === '<b>') { bold = true; return null }
    if (part === '</b>') { bold = false; return null }
    return bold ? <strong key={i}>{part}</strong> : part
  })
}

export default function App() {
  const [activeTab, setActiveTab] = useState('home')
  const [jobs, setJobs] = useState([])
  const [stats, setStats] = useState(null)
  const [activity, setActivity] = useState([])
  const [trending, setTrending] = useState({ tweets: [], news: [] })
  const [links, setLinks] = useState([])
  const [insights, setInsights] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedJob, setSelectedJob] = useState(null)
  const [searchRunning, setSearchRunning] = useState(false)
  const [showApplyPanel, setShowApplyPanel] = useState(false)
  const [applyRunning, setApplyRunning] = useState(false)
  const [applyResults, setApplyResults] = useState(null)
  const [applyProgress, setApplyProgress] = useState(null)
  const [activeStatFilter, setActiveStatFilter] = useState('all')

  // ── Fetch Data ──
  const fetchJobs = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (search) params.set('search', search)
      const res = await fetch(`${API}/api/jobs?${params}&limit=500`)
      const data = await res.json()
      setJobs(data.jobs || [])
    } catch (err) { console.error('Failed to fetch jobs:', err) }
  }, [statusFilter, search])

  const fetchStats = async () => {
    try { const res = await fetch(`${API}/api/stats`); setStats(await res.json()) } catch {}
  }
  const fetchActivity = async () => {
    try { const res = await fetch(`${API}/api/activity?limit=20`); setActivity(await res.json()) } catch {}
  }
  const fetchTrending = async () => {
    try { const res = await fetch(`${API}/api/trending`); setTrending(await res.json()) } catch {}
  }
  const fetchLinks = async () => {
    try { const res = await fetch(`${API}/api/profile/links`); const d = await res.json(); if (d.length) setLinks(d) } catch {}
  }
  const fetchInsights = async () => {
    try { const res = await fetch(`${API}/api/insights`); const d = await res.json(); if (d.length) setInsights(d) } catch {}
  }

  useEffect(() => { fetchJobs() }, [fetchJobs])
  useEffect(() => {
    fetchStats(); fetchActivity(); fetchTrending(); fetchLinks(); fetchInsights()
    const i = setInterval(() => { fetchStats(); fetchActivity() }, 30000)
    return () => clearInterval(i)
  }, [])

  // ── Actions ──
  const triggerSearch = async () => {
    setSearchRunning(true)
    await fetch(`${API}/api/search`, { method: 'POST' })
    const poll = setInterval(async () => {
      const res = await fetch(`${API}/api/search/status`)
      const data = await res.json()
      if (!data.inProgress) {
        clearInterval(poll); setSearchRunning(false)
        fetchJobs(); fetchStats(); fetchActivity()
      }
    }, 5000)
  }

  const updateStatus = async (id, status) => {
    await fetch(`${API}/api/jobs/${id}/status`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    fetchJobs(); fetchStats()
    if (selectedJob?.id === id) setSelectedJob({ ...selectedJob, status })
  }

  const applyToJob = async (jobId) => {
    await fetch(`${API}/api/jobs/${jobId}/apply`, { method: 'POST' })
    fetchActivity()
  }

  const triggerAutoApply = async (tiers, maxApps) => {
    setApplyRunning(true); setApplyResults(null)
    setApplyProgress({ current: 0, total: maxApps, currentJob: 'Starting agent...' })
    await fetch(`${API}/api/apply/auto`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tiers, maxApps }),
    })
    let lastCount = 0
    const poll = setInterval(async () => {
      try {
        const [statusRes, activityRes] = await Promise.all([
          fetch(`${API}/api/apply/status`),
          fetch(`${API}/api/activity?limit=5`),
        ])
        const data = await statusRes.json()
        const acts = await activityRes.json()
        const applyActs = acts.filter(a => a.type === 'apply')
        if (applyActs.length > 0) {
          const latest = applyActs[0].message
          const doneCount = (data.results?.results || []).length
          if (doneCount !== lastCount) { lastCount = doneCount; fetchJobs() }
          setApplyProgress({ current: doneCount, total: maxApps, currentJob: latest })
        }
        if (!data.inProgress) {
          clearInterval(poll); setApplyRunning(false)
          setApplyResults(data.results); setApplyProgress(null)
          fetchJobs(); fetchStats(); fetchActivity()
        }
      } catch {}
    }, 5000)
  }

  const filtered = jobs.filter(j => {
    if (sourceFilter === 'linkedin') return (j.url || '').includes('linkedin.com')
    if (sourceFilter === 'greenhouse') return (j.url || '').includes('greenhouse')
    if (sourceFilter === 'lever') return (j.url || '').includes('lever.co')
    return true
  })

  const handleStatClick = (key) => {
    setActiveStatFilter(key)
    if (key === 'all') { setStatusFilter('all') }
    else if (['applied', 'interviewing', 'offer'].includes(key)) { setStatusFilter(key) }
    else { setStatusFilter('all') }
  }

  const s = stats?.stats || {}
  const TABS = [
    { id: 'home', label: 'Home' },
    { id: 'jobs', label: 'Jobs' },
    { id: 'resume', label: 'Resume' },
    { id: 'prep', label: 'Interview Prep' },
    { id: 'links', label: 'Links' },
    { id: 'settings', label: 'Settings' },
  ]

  return (
    <div>
      {/* ═══ TOP NAV ═══ */}
      <nav className="top-nav">
        <div className="nav-logo" onClick={() => setActiveTab('home')}>
          <div className="nav-logo-mark">JQ</div>
          <span>JobHQ</span>
        </div>

        <div className="nav-tabs">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`nav-tab ${activeTab === t.id ? 'active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <input
          className="nav-search"
          type="text"
          placeholder="Search jobs, companies..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <div className="nav-actions">
          <button
            className={`btn-scan ${searchRunning ? 'running' : ''}`}
            onClick={triggerSearch}
            disabled={searchRunning}
          >
            {searchRunning ? 'Scanning...' : 'Scan Jobs'}
          </button>
          <button
            className={`btn-auto ${applyRunning ? 'running' : ''}`}
            onClick={() => { setActiveTab('jobs'); setShowApplyPanel(!showApplyPanel) }}
          >
            {applyRunning ? 'Applying...' : 'Auto-Apply'}
          </button>
        </div>
      </nav>

      {/* ═══ PAGE CONTENT ═══ */}
      <div className="page">

        {/* ── HOME TAB ── */}
        {activeTab === 'home' && (
          <div className="home-grid">
            <div className="feed">
              <div className="feed-section-label">Trending in Your Industry</div>

              {/* AI Insights */}
              {insights.map((tip, i) => (
                <div key={`ins-${i}`} className="feed-card">
                  <div className="insight-title">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2"><path d="M9 18h6M12 2v1m0 18v1m-7-3l.7-.7m12.6-12.6l.7-.7M2 12h1m18 0h1M5.6 5.6l-.7-.7m12.6 12.6l.7.7"/><circle cx="12" cy="12" r="4"/></svg>
                    {tip.title}
                  </div>
                  <div className="insight-body">{tip.body}</div>
                </div>
              ))}

              {/* Tweets */}
              {(trending.tweets || []).map((t, i) => (
                <a key={`tw-${i}`} className="feed-card feed-card-clickable" href={t.url || '#'} target="_blank" rel="noopener noreferrer">
                  <div className="tweet-header">
                    <span className="tweet-author">{t.name}</span>
                    <span className="tweet-handle">{t.handle}</span>
                    <span className="tweet-time">{t.time}</span>
                  </div>
                  <div className="tweet-body">{renderTweetBody(t.body)}</div>
                  <div className="tweet-tags">
                    {(t.tags || []).map((tag, j) => (
                      <span key={j} className="tweet-tag">{typeof tag === 'string' ? tag : tag.label}</span>
                    ))}
                  </div>
                  <div className="tweet-metrics">
                    <span>{t.comments} replies</span>
                    <span>{t.retweets} reposts</span>
                    <span>{t.likes} likes</span>
                  </div>
                </a>
              ))}

              {/* News */}
              <div className="feed-section-label" style={{ marginTop: 8 }}>Latest News</div>
              {(trending.news || []).map((n, i) => (
                <a key={`news-${i}`} className="feed-card feed-card-clickable" href={n.url || '#'} target="_blank" rel="noopener noreferrer">
                  <div className="news-source">{n.source}</div>
                  <div className="news-title">{n.title}</div>
                  <div className="news-meta">{n.time} · {n.readTime} read</div>
                </a>
              ))}
            </div>

            {/* ── Right Sidebar ── */}
            <div className="home-sidebar">
              {/* Stats */}
              <div className="widget">
                <div className="widget-title">Pipeline Snapshot</div>
                <div className="stats-grid">
                  <div className="stat-cell">
                    <div className="stat-value blue">{s.total || jobs.length}</div>
                    <div className="stat-label">Total</div>
                  </div>
                  <div className="stat-cell">
                    <div className="stat-value gold">{s.tier_a || 0}</div>
                    <div className="stat-label">Tier A</div>
                  </div>
                  <div className="stat-cell">
                    <div className="stat-value green">{s.applied || 0}</div>
                    <div className="stat-label">Applied</div>
                  </div>
                  <div className="stat-cell">
                    <div className="stat-value cyan">{s.interviewing || 0}</div>
                    <div className="stat-label">Interviews</div>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('jobs')}
                  style={{
                    width: '100%', marginTop: 14, padding: '10px', borderRadius: 8,
                    border: '1px solid var(--border)', background: 'var(--blue-dim)',
                    color: '#60a5fa', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    fontFamily: 'var(--sans)', transition: 'var(--transition)',
                  }}
                >
                  View All Jobs
                </button>
              </div>

              {/* Quick Access Links */}
              <div className="widget">
                <div className="widget-title">Quick Access</div>
                {links.map((lnk, i) => (
                  lnk.url ? (
                    <a key={i} className="qlink qlink-clickable" href={lnk.url} target="_blank" rel="noopener noreferrer">
                      <div className="qlink-icon">{lnk.icon}</div>
                      <div>
                        <div className="qlink-text">{lnk.title}</div>
                        <div className="qlink-sub">{lnk.sub || ''}</div>
                      </div>
                      <span className="qlink-arrow">&#8599;</span>
                    </a>
                  ) : (
                    <div key={i} className="qlink">
                      <div className="qlink-icon">{lnk.icon}</div>
                      <div>
                        <div className="qlink-text">{lnk.title}</div>
                        <div className="qlink-sub">{lnk.sub || 'No URL set'}</div>
                      </div>
                    </div>
                  )
                ))}
              </div>

              {/* Recent Activity */}
              <div className="widget">
                <div className="widget-title">Recent Activity</div>
                {(activity || []).slice(0, 8).map((a, i) => (
                  <div key={i} className="act-item">
                    <span className={`act-dot ${a.type}`} />
                    <span className="act-msg">{a.message}</span>
                    <span className="act-time">
                      {new Date(a.created_at + 'Z').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
                {(!activity || activity.length === 0) && (
                  <div style={{ fontSize: 12, color: 'var(--text-dim)', padding: '12px 0' }}>No activity yet.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── JOBS TAB ── */}
        {activeTab === 'jobs' && (
          <div className="jobs-page">
            <AutoApplyPanel
              show={showApplyPanel}
              onClose={() => { setApplyResults(null); setShowApplyPanel(false) }}
              onLaunch={triggerAutoApply}
              applyRunning={applyRunning}
              applyProgress={applyProgress}
              applyResults={applyResults}
            />
            <StatsStrip stats={stats?.stats} activeStatFilter={activeStatFilter} onStatClick={handleStatClick} />
            <FilterBar sourceFilter={sourceFilter} statusFilter={statusFilter} onSourceChange={setSourceFilter} onStatusChange={setStatusFilter} />
            <JobTable jobs={filtered} selectedJobId={selectedJob?.id} onSelectJob={(j) => setSelectedJob(j)} />
          </div>
        )}

        {/* ── OTHER TABS ── */}
        {activeTab === 'resume' && <ResumeView />}
        {activeTab === 'prep' && <InterviewPrepView />}
        {activeTab === 'links' && <LinksView />}
        {activeTab === 'settings' && <SettingsView />}
      </div>

      {/* ═══ JOB DRAWER ═══ */}
      {selectedJob && (
        <>
          <div className="job-drawer-overlay" onClick={() => setSelectedJob(null)} />
          <div className="job-drawer">
            <button className="jd-close" onClick={() => setSelectedJob(null)}>&#215;</button>
            <div className="jd-title">{selectedJob.title}</div>
            <div className="jd-company">{selectedJob.company} · {selectedJob.location}</div>
            <div className="jd-meta">
              <span className={`jd-meta-chip`}>Tier {selectedJob.tier}</span>
              <span className={`jd-meta-chip`}>Score: {selectedJob.fit_score}</span>
              <span className={`status-badge ${selectedJob.status}`}>{selectedJob.status}</span>
            </div>

            {selectedJob.cover_letter && (
              <div className="jd-section">
                <div className="jd-section-title">Cover Letter</div>
                <div className="jd-section-body">{selectedJob.cover_letter}</div>
              </div>
            )}
            {selectedJob.linkedin_msg && (
              <div className="jd-section">
                <div className="jd-section-title">LinkedIn Outreach</div>
                <div className="jd-section-body">{selectedJob.linkedin_msg}</div>
              </div>
            )}
            {selectedJob.email_msg && (
              <div className="jd-section">
                <div className="jd-section-title">Email Template</div>
                <div className="jd-section-body">{selectedJob.email_msg}</div>
              </div>
            )}

            <div className="jd-actions">
              {selectedJob.url && (
                <a href={selectedJob.url} target="_blank" rel="noopener noreferrer" className="jd-btn jd-btn-primary">
                  Apply Now &#8599;
                </a>
              )}
              {selectedJob.status !== 'saved' && (
                <button className="jd-btn jd-btn-secondary" onClick={() => updateStatus(selectedJob.id, 'saved')}>Save</button>
              )}
              {selectedJob.status !== 'applied' && (
                <button className="jd-btn jd-btn-secondary" onClick={() => updateStatus(selectedJob.id, 'applied')}>Mark Applied</button>
              )}
              {selectedJob.status !== 'interviewing' && (
                <button className="jd-btn jd-btn-secondary" onClick={() => updateStatus(selectedJob.id, 'interviewing')}>Interviewing</button>
              )}
              {selectedJob.status !== 'hidden' && (
                <button className="jd-btn jd-btn-secondary" onClick={() => updateStatus(selectedJob.id, 'hidden')}>Hide</button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
