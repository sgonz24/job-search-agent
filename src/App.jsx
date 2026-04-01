import { useState, useEffect, useCallback } from 'react'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import TrendingPanel from './components/TrendingPanel'
import StatsStrip from './components/StatsStrip'
import FilterBar from './components/FilterBar'
import JobTable from './components/JobTable'
import BoardView from './components/BoardView'
import ContextPanel from './components/ContextPanel'
import JobDrawer from './components/JobDrawer'
import AutoApplyPanel from './components/AutoApplyPanel'
import './App.css'

const API = import.meta.env.VITE_API_URL || ''

export default function App() {
  const [activeView, setActiveView] = useState('pipeline')
  const [jobs, setJobs] = useState([])
  const [stats, setStats] = useState(null)
  const [activity, setActivity] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedJob, setSelectedJob] = useState(null)
  const [searchRunning, setSearchRunning] = useState(false)
  const [showApplyPanel, setShowApplyPanel] = useState(false)
  const [applyRunning, setApplyRunning] = useState(false)
  const [applyResults, setApplyResults] = useState(null)
  const [applyProgress, setApplyProgress] = useState(null)
  const [trendingCollapsed, setTrendingCollapsed] = useState(false)
  const [activeStatFilter, setActiveStatFilter] = useState('all')

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
  useEffect(() => {
    fetchStats(); fetchActivity()
    const i = setInterval(() => { fetchStats(); fetchActivity() }, 30000)
    return () => clearInterval(i)
  }, [])

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

  // Filter jobs by source
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

  const renderMainView = () => {
    switch (activeView) {
      case 'board':
        return <BoardView jobs={filtered} selectedJobId={selectedJob?.id} onSelectJob={(j) => setSelectedJob(j)} />
      case 'resume':
        return <div className="placeholder-view"><h2>Resume</h2><p>Coming soon — upload, preview, and track resume versions.</p></div>
      case 'prep':
        return <div className="placeholder-view"><h2>Interview Prep</h2><p>Coming soon — full question bank by company and category.</p></div>
      case 'links':
        return <div className="placeholder-view"><h2>Links &amp; Portfolio</h2><p>Coming soon — manage your web presence links.</p></div>
      case 'settings':
        return <div className="placeholder-view"><h2>Settings</h2><p>Coming soon — configure scan sources and auto-apply preferences.</p></div>
      default:
        return (
          <div className="pipeline">
            <StatsStrip stats={stats?.stats} activeStatFilter={activeStatFilter} onStatClick={handleStatClick} />
            <FilterBar sourceFilter={sourceFilter} statusFilter={statusFilter} onSourceChange={setSourceFilter} onStatusChange={setStatusFilter} />
            <JobTable jobs={filtered} selectedJobId={selectedJob?.id} onSelectJob={(j) => setSelectedJob(j)} />
          </div>
        )
    }
  }

  return (
    <div className="app-shell">
      <Sidebar activeView={activeView} onNavigate={setActiveView} />

      <div className="app-main">
        <Topbar
          activeView={activeView}
          jobCount={filtered.length}
          searchRunning={searchRunning}
          onTriggerSearch={triggerSearch}
          onToggleAutoApply={() => setShowApplyPanel(!showApplyPanel)}
          search={search}
          onSearchChange={setSearch}
        />

        <AutoApplyPanel
          show={showApplyPanel}
          onClose={() => { setApplyResults(null); setShowApplyPanel(false) }}
          onLaunch={triggerAutoApply}
          applyRunning={applyRunning}
          applyProgress={applyProgress}
          applyResults={applyResults}
        />

        <div className="content-grid">
          <TrendingPanel collapsed={trendingCollapsed} onToggleCollapse={() => setTrendingCollapsed(!trendingCollapsed)} />

          <div className="center-content">
            {trendingCollapsed && (
              <button className="trending-expand" onClick={() => setTrendingCollapsed(false)} title="Show Trending">›</button>
            )}
            {renderMainView()}
          </div>

          <ContextPanel activity={activity} />
        </div>
      </div>

      <JobDrawer
        job={selectedJob}
        onClose={() => setSelectedJob(null)}
        onUpdateStatus={updateStatus}
        onApply={applyToJob}
      />
    </div>
  )
}
