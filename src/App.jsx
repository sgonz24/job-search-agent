import { useState, useEffect, useCallback } from 'react'
import './App.css'

const API = import.meta.env.VITE_API_URL || ''

function App() {
  const [jobs, setJobs] = useState([])
  const [stats, setStats] = useState(null)
  const [activity, setActivity] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedJob, setSelectedJob] = useState(null)
  const [searchRunning, setSearchRunning] = useState(false)
  const [tab, setTab] = useState('cover_letter')
  const [copied, setCopied] = useState(false)
  const [applyRunning, setApplyRunning] = useState(false)
  const [applyResults, setApplyResults] = useState(null)
  const [applyProgress, setApplyProgress] = useState(null) // { current, total, currentJob }
  const [showApplyPanel, setShowApplyPanel] = useState(false)
  const [applyTiers, setApplyTiers] = useState(['A', 'B'])
  const [applyMax, setApplyMax] = useState(5)
  const [view, setView] = useState('board') // 'board' or 'list'

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

  useEffect(() => { fetchJobs() }, [fetchJobs])
  useEffect(() => { fetchStats(); fetchActivity(); const i = setInterval(() => { fetchStats(); fetchActivity() }, 30000); return () => clearInterval(i) }, [])

  const triggerSearch = async () => {
    setSearchRunning(true)
    await fetch(`${API}/api/search`, { method: 'POST' })
    const poll = setInterval(async () => {
      const res = await fetch(`${API}/api/search/status`); const data = await res.json()
      if (!data.inProgress) { clearInterval(poll); setSearchRunning(false); fetchJobs(); fetchStats(); fetchActivity() }
    }, 5000)
  }

  const updateStatus = async (id, status) => {
    await fetch(`${API}/api/jobs/${id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
    fetchJobs(); fetchStats()
  }

  const applyToJob = async (jobId) => {
    await fetch(`${API}/api/jobs/${jobId}/apply`, { method: 'POST' }); fetchActivity()
  }

  const triggerAutoApply = async () => {
    setApplyRunning(true); setApplyResults(null); setApplyProgress({ current: 0, total: applyMax, currentJob: 'Starting agent...' })
    await fetch(`${API}/api/apply/auto`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tiers: applyTiers, maxApps: applyMax }) })
    let lastCount = 0
    const poll = setInterval(async () => {
      try {
        const [statusRes, activityRes] = await Promise.all([
          fetch(`${API}/api/apply/status`),
          fetch(`${API}/api/activity?limit=5`),
        ])
        const data = await statusRes.json()
        const acts = await activityRes.json()
        // Find latest apply activity for progress
        const applyActs = acts.filter(a => a.type === 'apply')
        if (applyActs.length > 0) {
          const latest = applyActs[0].message
          const doneCount = (data.results?.results || []).length
          if (doneCount !== lastCount) { lastCount = doneCount; fetchJobs() }
          setApplyProgress({ current: doneCount, total: applyMax, currentJob: latest })
        }
        if (!data.inProgress) {
          clearInterval(poll)
          setApplyRunning(false)
          setApplyResults(data.results)
          setApplyProgress(null)
          fetchJobs(); fetchStats(); fetchActivity()
        }
      } catch {}
    }, 5000)
  }

  const copyText = (text) => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  const tierColor = (tier) => tier === 'A' ? '#D4A017' : tier === 'B' ? '#888' : '#555'
  const statusLabel = (s) => ({ new: 'New', saved: 'Saved', applied: 'Applied', interviewing: 'Interview', rejected: 'Rejected', offer: 'OFFER!', hidden: 'Hidden' }[s] || s)

  // All jobs with URLs can be attempted by the agent
  const canAutoApply = (job) => {
    if (!job.url || !job.url.startsWith('http')) return false
    if (job.url.includes('remoteok.comhttps')) return false
    return true
  }

  const applyMethod = (job) => {
    if (job.easy_apply || job.apply_method === 'easy_apply') return 'Easy Apply'
    const url = (job.url || '').toLowerCase()
    if (url.includes('greenhouse')) return 'Greenhouse'
    if (url.includes('lever.co')) return 'Lever'
    if (url.includes('linkedin.com')) return 'LinkedIn'
    if (url.includes('indeed.com')) return 'Indeed'
    if (url.includes('ziprecruiter')) return 'ZipRecruiter'
    if (url.includes('builtin')) return 'BuiltIn'
    return job.source || 'Direct'
  }

  // Filter jobs
  const filtered = jobs.filter(j => {
    if (sourceFilter === 'auto') return canAutoApply(j)
    if (sourceFilter === 'manual') return !canAutoApply(j)
    if (sourceFilter === 'linkedin') return (j.url || '').includes('linkedin.com')
    if (sourceFilter === 'greenhouse') return (j.url || '').includes('greenhouse')
    return true
  })

  const autoApplyJobs = filtered.filter(j => canAutoApply(j))
  const manualJobs = filtered.filter(j => !canAutoApply(j))

  const tierA = filtered.filter(j => j.tier === 'A')
  const tierB = filtered.filter(j => j.tier === 'B')
  const tierC = filtered.filter(j => j.tier === 'C')

  const JobCard = ({ job }) => (
    <div className={`jcard ${selectedJob?.id === job.id ? 'selected' : ''}`} onClick={() => { setSelectedJob(job); setTab('cover_letter') }}>
      <div className="jcard-top">
        <span className="jscore-pill" style={{ background: tierColor(job.tier) }}>{job.fit_score}</span>
        {job.status !== 'new' && <span className={`jstatus s-${job.status}`}>{statusLabel(job.status)}</span>}
        <span className={`japply-method ${canAutoApply(job) ? 'auto' : 'manual'}`}>
          {canAutoApply(job) ? 'Auto' : 'Manual'}
        </span>
      </div>
      <h3 className="jtitle">{job.title}</h3>
      <p className="jcompany">{job.company}</p>
      {job.location && <p className="jloc">{job.location}</p>}
      {job.salary && <p className="jsalary">{job.salary}</p>}
      {!canAutoApply(job) && job.url && (
        <a href={job.url} target="_blank" rel="noopener" className="jcard-link" onClick={e => e.stopPropagation()}>View & Apply</a>
      )}
      {job.match_reasons?.length > 0 && (
        <div className="jtags">{job.match_reasons.slice(0, 2).map((r, i) => <span key={i} className="jtag">{r}</span>)}</div>
      )}
    </div>
  )

  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="header">
        <div className="header-inner">
          <div className="header-left">
            <h1>Job Search <span className="brand">Agent</span></h1>
            <p className="subtitle">Sonny R. Gonzalez | VP of Marketing | Remote | $150K+ | Powered by ai<strong>for</strong>roi.co</p>
          </div>
          <div className="header-right">
            <button className="apply-toggle" onClick={() => setShowApplyPanel(!showApplyPanel)}>
              Auto-Apply
            </button>
            <button className={`search-btn ${searchRunning ? 'running' : ''}`} onClick={triggerSearch} disabled={searchRunning}>
              {searchRunning ? 'Scanning...' : 'Scan Jobs'}
            </button>
          </div>
        </div>
      </header>

      {/* ── Stats ── */}
      {stats?.stats && (
        <div className="stats-bar">
          <div className="stat"><span className="stat-n">{stats.stats.total}</span><span className="stat-l">Total</span></div>
          <div className="stat gold"><span className="stat-n">{stats.stats.tier_a}</span><span className="stat-l">Tier A</span></div>
          <div className="stat"><span className="stat-n">{stats.stats.tier_b}</span><span className="stat-l">Tier B</span></div>
          <div className="stat"><span className="stat-n">{stats.stats.tier_c}</span><span className="stat-l">Tier C</span></div>
          <div className="stat-divider" />
          <div className="stat green"><span className="stat-n">{stats.stats.applied}</span><span className="stat-l">Applied</span></div>
          <div className="stat teal"><span className="stat-n">{stats.stats.interviewing}</span><span className="stat-l">Interviews</span></div>
          <div className="stat gold"><span className="stat-n">{stats.stats.offers}</span><span className="stat-l">Offers</span></div>
          <div className="stat-divider" />
          <div className="stat"><span className="stat-n mini">{stats.lastRun ? new Date(stats.lastRun.started_at + 'Z').toLocaleTimeString() : '—'}</span><span className="stat-l">Last Scan</span></div>
        </div>
      )}

      {/* ── Auto-Apply Panel ── */}
      {showApplyPanel && (
        <div className="apply-panel">
          {!applyRunning && !applyResults && (
            <>
              <h3>AI Auto-Apply Agent</h3>
              <p className="apply-desc">Select which tiers to apply to, set a max, and launch. The agent will open each job, fill forms, upload your resume, and submit — one at a time with 30-75s pauses between applications.</p>
              <div className="apply-controls">
                <div className="apply-setting">
                  <label>Apply to:</label>
                  <div className="filter-group">
                    {['A', 'B', 'C'].map(t => (
                      <button key={t} className={`fbtn ${applyTiers.includes(t) ? 'active' : ''}`}
                        style={applyTiers.includes(t) ? { background: tierColor(t), color: '#000', borderColor: tierColor(t) } : {}}
                        onClick={() => setApplyTiers(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])}>
                        Tier {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="apply-setting">
                  <label>Max apps:</label>
                  <select className="apply-select" value={applyMax} onChange={e => setApplyMax(Number(e.target.value))}>
                    {[1, 3, 5, 10, 15, 25].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <button className="apply-btn" onClick={triggerAutoApply} disabled={applyTiers.length === 0}>
                  Launch Agent ({applyTiers.join(' + ')} tiers, max {applyMax})
                </button>
              </div>
            </>
          )}

          {applyRunning && applyProgress && (
            <div className="apply-live">
              <div className="apply-live-header">
                <div className="apply-pulse" />
                <h3>Agent is applying... {applyProgress.current}/{applyProgress.total}</h3>
              </div>
              <div className="apply-progress-bar">
                <div className="apply-progress-fill" style={{ width: `${(applyProgress.current / applyProgress.total) * 100}%` }} />
              </div>
              <p className="apply-live-status">{applyProgress.currentJob}</p>
              <p className="apply-live-hint">This takes 30-75 seconds per application. Do not close this page.</p>
            </div>
          )}

          {applyResults && !applyRunning && (
            <div className="apply-done">
              <h3>Agent Complete</h3>
              <div className="apply-done-stats">
                <div className="apply-done-stat success">
                  <span className="apply-done-n">{applyResults.successful}</span>
                  <span>Applied</span>
                </div>
                <div className="apply-done-stat fail">
                  <span className="apply-done-n">{applyResults.failed}</span>
                  <span>Failed</span>
                </div>
                <div className="apply-done-stat total">
                  <span className="apply-done-n">{applyResults.total}</span>
                  <span>Total</span>
                </div>
              </div>
              {applyResults.results?.length > 0 && (
                <div className="apply-done-list">
                  {applyResults.results.map((r, i) => (
                    <div key={i} className={`apply-done-item ${r.success ? 'ok' : 'err'}`}>
                      <span className="apply-done-icon">{r.success ? 'Applied' : 'Failed'}</span>
                      <span className="apply-done-job">{r.title} @ {r.company}</span>
                      {r.fieldsFilled?.length > 0 && <span className="apply-done-fields">{r.fieldsFilled.length} fields</span>}
                      {!r.success && r.errors?.[0] && <span className="apply-done-err">{r.errors[0].substring(0, 60)}</span>}
                    </div>
                  ))}
                </div>
              )}
              <button className="apply-btn" style={{ marginTop: '0.75rem' }} onClick={() => { setApplyResults(null); setShowApplyPanel(false) }}>Done</button>
            </div>
          )}
        </div>
      )}

      {/* ── Filters ── */}
      <div className="controls">
        <div className="filter-row">
          <div className="filter-group">
            {[['all','All Jobs'],['linkedin','LinkedIn'],['greenhouse','Greenhouse'],['lever','Lever']].map(([k,l]) => (
              <button key={k} className={`fbtn ${sourceFilter === k ? 'active' : ''}`} onClick={() => setSourceFilter(k)}>
                {l}
              </button>
            ))}
          </div>
          <div className="filter-group">
            {[['all','All'],['new','New'],['saved','Saved'],['applied','Applied'],['interviewing','Interviews']].map(([k,l]) => (
              <button key={k} className={`fbtn ${statusFilter === k ? 'active' : ''}`} onClick={() => setStatusFilter(k)}>{l}</button>
            ))}
          </div>
          <div className="filter-group">
            <button className={`fbtn ${view === 'board' ? 'active' : ''}`} onClick={() => setView('board')}>Board</button>
            <button className={`fbtn ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}>List</button>
          </div>
          <input type="text" placeholder="Search..." className="search-input" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {/* ── 3-Column Board View ── */}
      {view === 'board' ? (
        <div className="board">
          <div className="board-col">
            <div className="board-header" style={{ borderColor: '#D4A017' }}>
              <span className="board-tier" style={{ color: '#D4A017' }}>TIER A</span>
              <span className="board-count">{tierA.length}</span>
              <span className="board-label">Apply Now</span>
            </div>
            <div className="board-cards">
              {tierA.length === 0 && <p className="board-empty">No Tier A matches yet</p>}
              {tierA.map(job => <JobCard key={job.id} job={job} />)}
            </div>
          </div>
          <div className="board-col">
            <div className="board-header" style={{ borderColor: '#888' }}>
              <span className="board-tier" style={{ color: '#fff' }}>TIER B</span>
              <span className="board-count">{tierB.length}</span>
              <span className="board-label">Worth Pursuing</span>
            </div>
            <div className="board-cards">
              {tierB.length === 0 && <p className="board-empty">No Tier B matches yet</p>}
              {tierB.map(job => <JobCard key={job.id} job={job} />)}
            </div>
          </div>
          <div className="board-col">
            <div className="board-header" style={{ borderColor: '#444' }}>
              <span className="board-tier" style={{ color: '#888' }}>TIER C</span>
              <span className="board-count">{tierC.length}</span>
              <span className="board-label">Review</span>
            </div>
            <div className="board-cards">
              {tierC.length === 0 && <p className="board-empty">No Tier C matches yet</p>}
              {tierC.slice(0, 50).map(job => <JobCard key={job.id} job={job} />)}
              {tierC.length > 50 && <p className="board-more">+{tierC.length - 50} more</p>}
            </div>
          </div>
        </div>
      ) : (
        <div className="list-view">
          {filtered.map(job => <JobCard key={job.id} job={job} />)}
        </div>
      )}

      {/* ── Detail Drawer ── */}
      {selectedJob && (
        <div className="drawer-overlay" onClick={(e) => { if (e.target === e.currentTarget) setSelectedJob(null) }}>
          <div className="drawer">
            <button className="drawer-close" onClick={() => setSelectedJob(null)}>X</button>

            <div className="drawer-head">
              <span className="tbadge lg" style={{ background: tierColor(selectedJob.tier) }}>{selectedJob.tier}</span>
              <div>
                <h2>{selectedJob.title}</h2>
                <p className="drawer-company">{selectedJob.company}</p>
              </div>
              <span className="drawer-score">{selectedJob.fit_score}<small>/100</small></span>
            </div>

            <div className="drawer-meta">
              <div className="drawer-meta-row">
                <span className="drawer-label">Location</span>
                <span>{selectedJob.location || 'Remote'}</span>
              </div>
              <div className="drawer-meta-row">
                <span className="drawer-label">Source</span>
                <span>{selectedJob.source}</span>
              </div>
              <div className="drawer-meta-row">
                <span className="drawer-label">Apply Via</span>
                <span className="drawer-apply-method">{applyMethod(selectedJob)}</span>
              </div>
              {selectedJob.salary && (
                <div className="drawer-meta-row">
                  <span className="drawer-label">Salary</span>
                  <span className="jsalary">{selectedJob.salary}</span>
                </div>
              )}
              {selectedJob.date_posted && (
                <div className="drawer-meta-row">
                  <span className="drawer-label">Posted</span>
                  <span>{selectedJob.date_posted}</span>
                </div>
              )}
            </div>

            <div className="drawer-actions">
              {selectedJob.url && <a href={selectedJob.url} target="_blank" rel="noopener" className="btn-primary">View Posting</a>}
              {canAutoApply(selectedJob) && selectedJob.status !== 'applied' && (
                <button className="btn-apply" onClick={() => applyToJob(selectedJob.id)}>Auto-Apply</button>
              )}
              {!canAutoApply(selectedJob) && selectedJob.url && (
                <a href={selectedJob.url} target="_blank" rel="noopener" className="btn-manual">Go Apply Manually</a>
              )}
            </div>

            {selectedJob.match_reasons?.length > 0 && (
              <div className="drawer-section">
                <h4>Match Reasons</h4>
                <div className="jtags">{selectedJob.match_reasons.map((r, i) => <span key={i} className="jtag">{r}</span>)}</div>
              </div>
            )}

            <div className="drawer-section">
              <h4>Pipeline Status</h4>
              <div className="status-btns">
                {['new', 'saved', 'applied', 'interviewing', 'rejected', 'offer', 'hidden'].map(s => (
                  <button key={s} className={`sbtn ${selectedJob.status === s ? 'active' : ''} s-${s}`}
                    onClick={() => { updateStatus(selectedJob.id, s); setSelectedJob({...selectedJob, status: s}) }}>
                    {statusLabel(s)}
                  </button>
                ))}
              </div>
            </div>

            <div className="drawer-section">
              <div className="outreach-tabs">
                {[['cover_letter', 'Cover Letter'], ['linkedin_msg', 'LinkedIn'], ['email_msg', 'Email']].map(([key, label]) => (
                  <button key={key} className={`otab ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)}>{label}</button>
                ))}
              </div>
              <div className="outreach-body">
                <pre>{selectedJob[tab]}</pre>
                <button className="copy-btn" onClick={() => copyText(selectedJob[tab])}>{copied ? 'Copied!' : 'Copy'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Activity Log ── */}
      {activity.length > 0 && (
        <div className="activity">
          <h3>Activity Feed</h3>
          <div className="activity-list">
            {activity.slice(0, 8).map((a, i) => (
              <div key={i} className="aitem">
                <span className={`atype t-${a.type}`}>{a.type}</span>
                <span className="amsg">{a.message}</span>
                <span className="atime">{new Date(a.created_at + 'Z').toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="powered-by">
        Built by <a href="https://aiforroi.co" target="_blank" rel="noopener">ai<strong>for</strong>roi.co</a> — AI automation that proves ROI on camera, every week.
      </div>
    </div>
  )
}

export default App
