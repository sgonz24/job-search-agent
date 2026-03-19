import { useState, useEffect, useCallback } from 'react'
import './App.css'

const API = import.meta.env.VITE_API_URL || ''

function App() {
  const [jobs, setJobs] = useState([])
  const [stats, setStats] = useState(null)
  const [activity, setActivity] = useState([])
  const [filter, setFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedJob, setSelectedJob] = useState(null)
  const [searchRunning, setSearchRunning] = useState(false)
  const [tab, setTab] = useState('cover_letter')
  const [showLegend, setShowLegend] = useState(false)
  const [copied, setCopied] = useState(false)
  const [applyRunning, setApplyRunning] = useState(false)
  const [applyResults, setApplyResults] = useState(null)
  const [showApplyPanel, setShowApplyPanel] = useState(false)
  const [applyTiers, setApplyTiers] = useState(['A'])
  const [applyMax, setApplyMax] = useState(5)

  const fetchJobs = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filter !== 'all') params.set('tier', filter)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (search) params.set('search', search)
      const res = await fetch(`${API}/api/jobs?${params}`)
      const data = await res.json()
      setJobs(data.jobs || [])
    } catch (err) {
      console.error('Failed to fetch jobs:', err)
    }
  }, [filter, statusFilter, search])

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API}/api/stats`)
      const data = await res.json()
      setStats(data)
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  }

  const fetchActivity = async () => {
    try {
      const res = await fetch(`${API}/api/activity?limit=20`)
      const data = await res.json()
      setActivity(data)
    } catch (err) {
      console.error('Failed to fetch activity:', err)
    }
  }

  useEffect(() => { fetchJobs() }, [fetchJobs])
  useEffect(() => { fetchStats(); fetchActivity() }, [])

  const triggerSearch = async () => {
    setSearchRunning(true)
    await fetch(`${API}/api/search`, { method: 'POST' })
    const poll = setInterval(async () => {
      const res = await fetch(`${API}/api/search/status`)
      const data = await res.json()
      if (!data.inProgress) {
        clearInterval(poll)
        setSearchRunning(false)
        fetchJobs()
        fetchStats()
        fetchActivity()
      }
    }, 5000)
  }

  const updateStatus = async (id, status) => {
    await fetch(`${API}/api/jobs/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    fetchJobs()
    fetchStats()
  }

  const copyText = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Auto-apply to a single job
  const applyToJob = async (jobId) => {
    await fetch(`${API}/api/jobs/${jobId}/apply`, { method: 'POST' })
    fetchActivity()
  }

  // Batch auto-apply
  const triggerAutoApply = async () => {
    setApplyRunning(true)
    setApplyResults(null)
    await fetch(`${API}/api/apply/auto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tiers: applyTiers, maxApps: applyMax }),
    })
    const poll = setInterval(async () => {
      const res = await fetch(`${API}/api/apply/status`)
      const data = await res.json()
      if (!data.inProgress) {
        clearInterval(poll)
        setApplyRunning(false)
        setApplyResults(data.results)
        fetchJobs()
        fetchStats()
        fetchActivity()
      }
    }, 8000)
  }

  const tierColor = (tier) => tier === 'A' ? '#D4A017' : tier === 'B' ? '#888' : '#444'

  const statusLabel = (s) => ({
    new: 'New', saved: 'Saved', applied: 'Applied', interviewing: 'Interview',
    rejected: 'Rejected', offer: 'OFFER!', hidden: 'Hidden',
  }[s] || s)

  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="header">
        <div className="header-inner">
          <div className="header-left">
            <h1>Job Search <span className="brand">Agent</span></h1>
            <p className="subtitle">Sonny R. Gonzalez — VP of Marketing — Remote Only — $150K+ Target — Powered by ai<strong>for</strong>roi.co</p>
          </div>
          <div className="header-right">
            <button className="legend-toggle" onClick={() => setShowLegend(!showLegend)}>
              {showLegend ? 'Hide' : 'Scoring'} Legend
            </button>
            <button className="apply-toggle" onClick={() => setShowApplyPanel(!showApplyPanel)}>
              Auto-Apply
            </button>
            <button
              className={`search-btn ${searchRunning ? 'running' : ''}`}
              onClick={triggerSearch}
              disabled={searchRunning}
            >
              {searchRunning ? 'Searching...' : 'Run Search Now'}
            </button>
          </div>
        </div>
      </header>

      {/* ── Stats ── */}
      {stats?.stats && (
        <div className="stats-bar">
          <div className="stat"><span className="stat-n">{stats.stats.total}</span><span className="stat-l">Total</span></div>
          <div className="stat orange"><span className="stat-n">{stats.stats.tier_a}</span><span className="stat-l">Tier A</span></div>
          <div className="stat blue"><span className="stat-n">{stats.stats.tier_b}</span><span className="stat-l">Tier B</span></div>
          <div className="stat"><span className="stat-n">{stats.stats.tier_c}</span><span className="stat-l">Tier C</span></div>
          <div className="stat-divider" />
          <div className="stat green"><span className="stat-n">{stats.stats.applied}</span><span className="stat-l">Applied</span></div>
          <div className="stat teal"><span className="stat-n">{stats.stats.interviewing}</span><span className="stat-l">Interviews</span></div>
          <div className="stat gold"><span className="stat-n">{stats.stats.offers}</span><span className="stat-l">Offers</span></div>
        </div>
      )}

      {/* ── Scoring Legend ── */}
      {showLegend && (
        <div className="legend-panel">
          <h3>Scoring Logic — How Jobs Are Ranked Against Your Profile</h3>
          <div className="legend-grid">
            <div className="legend-col">
              <h4>Positive Signals</h4>
              <table>
                <tbody>
                  <tr><td className="pts">+30-35</td><td>VP / CMO / SVP in title</td><td className="match">10+ yrs exec marketing</td></tr>
                  <tr><td className="pts">+10</td><td>Marketing in title</td><td className="match">Dir. Marketing @ SolarTech, CMO @ Ember Pro</td></tr>
                  <tr><td className="pts">+15</td><td>Remote position</td><td className="match">Remote only requirement</td></tr>
                  <tr><td className="pts">+15</td><td>AI / Automation mentioned</td><td className="match">Top 1% AI — 10+ production systems</td></tr>
                  <tr><td className="pts">+10</td><td>Automation keyword</td><td className="match">Builds autonomous agent workflows</td></tr>
                  <tr><td className="pts">+8</td><td>GTM / Go-to-market</td><td className="match">Built GTM from scratch @ Ember Pro</td></tr>
                  <tr><td className="pts">+8</td><td>Growth / Demand Gen</td><td className="match">300% YOY sales growth @ Eevelle</td></tr>
                  <tr><td className="pts">+5-10</td><td>B2B + B2C combined</td><td className="match">Both across solar, hospitality, blockchain</td></tr>
                  <tr><td className="pts">+5</td><td>P&L / Budget mgmt</td><td className="match">$60M P&L @ Welk Resort Group</td></tr>
                  <tr><td className="pts">+5-10</td><td>Salary listed $150K+</td><td className="match">$150K minimum target</td></tr>
                  <tr><td className="pts">+3-10</td><td>Industry match (SaaS, Tech, etc.)</td><td className="match">Solar, defense tech, blockchain, hospitality</td></tr>
                </tbody>
              </table>
            </div>
            <div className="legend-col">
              <h4>Negative Signals</h4>
              <table>
                <tbody>
                  <tr className="neg"><td className="pts">-20</td><td>On-site / In-office only</td><td className="match">Excluded — remote only</td></tr>
                  <tr className="neg"><td className="pts">-30</td><td>Junior / Entry / Intern</td><td className="match">Excluded — exec level</td></tr>
                  <tr className="neg"><td className="pts">-20</td><td>Coordinator / Specialist</td><td className="match">Excluded — too junior</td></tr>
                  <tr className="neg"><td className="pts">-25</td><td>Assistant / Associate</td><td className="match">Excluded — too junior</td></tr>
                  <tr className="neg"><td className="pts">-5</td><td>Hybrid (no remote)</td><td className="match">Penalized — prefer fully remote</td></tr>
                </tbody>
              </table>
              <h4>Tier Thresholds</h4>
              <div className="tier-legend-items">
                <div><span className="dot" style={{background:'#D4A017'}}/> <strong>Tier A (70+)</strong> — Apply immediately</div>
                <div><span className="dot" style={{background:'#888'}}/> <strong>Tier B (50-69)</strong> — Worth pursuing</div>
                <div><span className="dot" style={{background:'#444'}}/> <strong>Tier C (30-49)</strong> — Review manually</div>
                <div><span className="dot" style={{background:'#dc2626'}}/> <strong>Tier D (&lt;30)</strong> — Filtered out</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Auto-Apply Panel ── */}
      {showApplyPanel && (
        <div className="apply-panel">
          <div className="apply-panel-header">
            <h3>AI Auto-Apply Agent</h3>
            <p className="apply-desc">The agent opens each job posting, detects the ATS (Greenhouse, Lever, Workable, etc.), fills the form with your profile, uploads your resume, generates AI-powered answers to custom questions, and submits — with human-like pacing between applications.</p>
          </div>
          <div className="apply-controls">
            <div className="apply-setting">
              <label>Apply to tiers:</label>
              <div className="filter-group">
                {['A', 'B'].map(t => (
                  <button key={t}
                    className={`fbtn ${applyTiers.includes(t) ? 'active' : ''}`}
                    style={applyTiers.includes(t) ? { background: tierColor(t), color: '#fff', borderColor: tierColor(t) } : {}}
                    onClick={() => {
                      setApplyTiers(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
                    }}>
                    Tier {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="apply-setting">
              <label>Max applications:</label>
              <select className="apply-select" value={applyMax} onChange={e => setApplyMax(Number(e.target.value))}>
                {[1, 3, 5, 10, 15, 25].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <button
              className={`apply-btn ${applyRunning ? 'running' : ''}`}
              onClick={triggerAutoApply}
              disabled={applyRunning || applyTiers.length === 0}
            >
              {applyRunning ? 'Agent Applying...' : `Launch Auto-Apply (${applyTiers.join('+')} tiers, max ${applyMax})`}
            </button>
          </div>
          {applyResults && (
            <div className="apply-results">
              <div className="apply-stat-row">
                <span className="apply-stat success">{applyResults.successful} Applied</span>
                <span className="apply-stat fail">{applyResults.failed} Failed</span>
                <span className="apply-stat total">{applyResults.total} Total</span>
              </div>
              {applyResults.results?.map((r, i) => (
                <div key={i} className={`apply-result-item ${r.success ? 'ok' : 'err'}`}>
                  <span>{r.success ? '[OK]' : '[FAIL]'}</span>
                  <span>Job #{r.jobId} — {r.atsType}</span>
                  <span>{r.fieldsFilled?.length || 0} fields filled</span>
                  {r.errors?.length > 0 && <span className="apply-err">{r.errors[0]}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Filters ── */}
      <div className="controls">
        <div className="filter-row">
          <div className="filter-group">
            {['all', 'A', 'B', 'C'].map(t => (
              <button key={t}
                className={`fbtn ${filter === t ? 'active' : ''}`}
                style={filter === t && t !== 'all' ? { background: tierColor(t), color: '#fff', borderColor: tierColor(t) } : {}}
                onClick={() => setFilter(t)}>
                {t === 'all' ? 'All Tiers' : `Tier ${t}`}
              </button>
            ))}
          </div>
          <div className="filter-group">
            {['all', 'new', 'saved', 'applied', 'interviewing'].map(s => (
              <button key={s} className={`fbtn ${statusFilter === s ? 'active' : ''}`}
                onClick={() => setStatusFilter(s)}>
                {s === 'all' ? 'All Status' : statusLabel(s)}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Search title or company..."
            className="search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ── Main Layout ── */}
      <div className="main">
        <div className="job-list">
          {jobs.length === 0 && (
            <div className="empty">
              <p>No jobs yet. Hit <strong>Run Search Now</strong> to scan LinkedIn, Indeed, RemoteOK, WeWorkRemotely, and BuiltIn.</p>
            </div>
          )}
          {jobs.map(job => (
            <div key={job.id}
              className={`jcard ${selectedJob?.id === job.id ? 'selected' : ''} tier-${job.tier}`}
              onClick={() => { setSelectedJob(job); setTab('cover_letter') }}
            >
              <div className="jcard-top">
                <span className="tbadge" style={{ background: tierColor(job.tier) }}>{job.tier}</span>
                <span className="jscore">{job.fit_score}</span>
                {job.status !== 'new' && <span className={`jstatus s-${job.status}`}>{statusLabel(job.status)}</span>}
              </div>
              <h3 className="jtitle">{job.title}</h3>
              <p className="jcompany">{job.company}</p>
              <div className="jmeta">
                <span>{job.location}</span>
                <span className="jsource">{job.source}</span>
                {job.salary && <span className="jsalary">{job.salary}</span>}
              </div>
              <div className="jbar"><div className="jfill" style={{ width: `${job.fit_score}%`, background: tierColor(job.tier) }}/></div>
              {job.match_reasons?.length > 0 && (
                <div className="jtags">
                  {job.match_reasons.slice(0, 3).map((r, i) => <span key={i} className="jtag">{r}</span>)}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── Detail Panel ── */}
        {selectedJob && (
          <div className="detail">
            <div className="detail-head">
              <span className="tbadge lg" style={{ background: tierColor(selectedJob.tier) }}>{selectedJob.tier}</span>
              <div className="detail-info">
                <h2>{selectedJob.title}</h2>
                <p>{selectedJob.company} — {selectedJob.location}</p>
              </div>
              <span className="detail-score">{selectedJob.fit_score}<small>/100</small></span>
            </div>

            <div className="detail-actions">
              {selectedJob.url && (
                <a href={selectedJob.url} target="_blank" rel="noopener" className="btn-primary">View Job Posting</a>
              )}
              {selectedJob.url && selectedJob.status !== 'applied' && (
                <button className="btn-apply" onClick={() => applyToJob(selectedJob.id)}>
                  AI Auto-Apply
                </button>
              )}
              <span className="detail-src">via {selectedJob.source}</span>
              {selectedJob.salary && <span className="jsalary">{selectedJob.salary}</span>}
            </div>

            {selectedJob.match_reasons?.length > 0 && (
              <div className="detail-block">
                <h4>Why This Matches</h4>
                <div className="jtags">{selectedJob.match_reasons.map((r, i) => <span key={i} className="jtag">{r}</span>)}</div>
              </div>
            )}

            <div className="detail-block">
              <h4>Status</h4>
              <div className="status-btns">
                {['new', 'saved', 'applied', 'interviewing', 'rejected', 'offer', 'hidden'].map(s => (
                  <button key={s}
                    className={`sbtn ${selectedJob.status === s ? 'active' : ''} s-${s}`}
                    onClick={() => { updateStatus(selectedJob.id, s); setSelectedJob({...selectedJob, status: s}) }}>
                    {statusLabel(s)}
                  </button>
                ))}
              </div>
            </div>

            <div className="detail-block">
              <div className="outreach-tabs">
                {[
                  ['cover_letter', 'Cover Letter'],
                  ['linkedin_msg', 'LinkedIn Message'],
                  ['email_msg', 'Email Outreach'],
                ].map(([key, label]) => (
                  <button key={key} className={`otab ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)}>{label}</button>
                ))}
              </div>
              <div className="outreach-body">
                <pre>{selectedJob[tab]}</pre>
                <button className="copy-btn" onClick={() => copyText(selectedJob[tab])}>
                  {copied ? 'Copied!' : 'Copy to Clipboard'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Activity Log ── */}
      {activity.length > 0 && (
        <div className="activity">
          <h3>Recent Activity</h3>
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
