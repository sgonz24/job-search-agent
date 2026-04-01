# JobHQ Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the Job Search Agent from a Kanban dashboard into a modern 3-panel command center with icon sidebar, pipeline table, trending feed, and intelligence panel.

**Architecture:** Decompose the monolithic App.jsx (450 lines) into focused components. Add a 64px icon sidebar for navigation, replace the default card grid with a full-width sortable table, add a collapsible trending feed panel (left), and a contextual intelligence panel (right). All existing functionality preserved. Four new static API endpoints on the backend.

**Tech Stack:** React 19, Vite 8, vanilla CSS, Express backend (existing)

---

## File Structure

### New Files (Frontend — `src/`)
| File | Responsibility |
|------|---------------|
| `src/components/Sidebar.jsx` | 64px icon rail navigation, active state, tooltips |
| `src/components/Sidebar.css` | Sidebar styles |
| `src/components/Topbar.jsx` | Page title, search, scan/auto-apply buttons |
| `src/components/Topbar.css` | Topbar styles |
| `src/components/StatsStrip.jsx` | Clickable stat cells row |
| `src/components/FilterBar.jsx` | Source + status chip filters + search input |
| `src/components/JobTable.jsx` | Full-width sortable job rows |
| `src/components/JobTable.css` | Table + row styles |
| `src/components/TrendingPanel.jsx` | Left panel — trending feed with tabs |
| `src/components/TrendingPanel.css` | Trending panel styles |
| `src/components/ContextPanel.jsx` | Right panel — insights, prep, links, activity |
| `src/components/ContextPanel.css` | Context panel styles |
| `src/components/JobDrawer.jsx` | Detail drawer (extracted from App.jsx) |
| `src/components/JobDrawer.css` | Drawer styles |
| `src/components/AutoApplyPanel.jsx` | Auto-apply overlay (extracted from App.jsx) |
| `src/components/BoardView.jsx` | Existing Kanban board (extracted from App.jsx) |

### Modified Files
| File | Changes |
|------|---------|
| `src/App.jsx` | Gutted and rebuilt as layout shell — sidebar + topbar + 3-panel grid + routing |
| `src/App.css` | Gutted and rebuilt — layout grid only, component styles moved to component CSS files |
| `src/index.css` | Minor update — ensure html/body full height |

### New Files (Backend — `backend/src/`)
| File | Responsibility |
|------|---------------|
| `backend/src/routes/trending.js` | GET /api/trending — static mock data |
| `backend/src/routes/insights.js` | GET /api/insights — static tips |
| `backend/src/routes/interview-prep.js` | GET /api/interview-prep — static questions |
| `backend/src/routes/profile.js` | GET/PUT /api/profile/links — user links |

### Modified Files (Backend)
| File | Changes |
|------|---------|
| `backend/src/server.js` | Mount 4 new route files |

---

## Task 1: Create components directory and Sidebar

**Files:**
- Create: `src/components/Sidebar.jsx`
- Create: `src/components/Sidebar.css`

- [ ] **Step 1: Create components directory**

```bash
mkdir -p /Users/sonnygonzalezsolartech/job-search-app/frontend/src/components
```

- [ ] **Step 2: Write Sidebar.jsx**

```jsx
import './Sidebar.css'

const NAV_ITEMS = [
  { id: 'pipeline', icon: 'grid', label: 'Pipeline' },
  { id: 'board', icon: 'columns', label: 'Board' },
  { id: 'resume', icon: 'document', label: 'Resume' },
  { id: 'prep', icon: 'clock', label: 'Interview Prep', badge: true },
  { id: 'links', icon: 'link', label: 'Links & Portfolio' },
]

const ICONS = {
  grid: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  columns: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="5" height="18" rx="1"/><rect x="10" y="3" width="5" height="18" rx="1"/><rect x="17" y="3" width="5" height="18" rx="1"/>
    </svg>
  ),
  document: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>
    </svg>
  ),
  clock: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
    </svg>
  ),
  link: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  ),
  settings: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 1v2m0 18v2m-9-11h2m18 0h2m-3.64-6.36l-1.42 1.42M6.34 17.66l-1.42 1.42m0-14.14l1.42 1.42m11.32 11.32l1.42 1.42"/>
    </svg>
  ),
}

export default function Sidebar({ activeView, onNavigate }) {
  return (
    <nav className="sidebar">
      <div className="sb-logo">JQ</div>

      {NAV_ITEMS.map(item => (
        <button
          key={item.id}
          className={`sb-icon ${activeView === item.id ? 'active' : ''}`}
          onClick={() => onNavigate(item.id)}
          title={item.label}
        >
          {ICONS[item.icon]}
          <span className="sb-tooltip">{item.label}</span>
          {item.badge && <span className="sb-badge" />}
        </button>
      ))}

      <div className="sb-spacer" />

      <button className="sb-icon" title="Settings" onClick={() => onNavigate('settings')}>
        {ICONS.settings}
        <span className="sb-tooltip">Settings</span>
      </button>
      <div className="sb-avatar">SG</div>
    </nav>
  )
}
```

- [ ] **Step 3: Write Sidebar.css**

```css
.sidebar {
  width: 64px;
  background: #0c0c14;
  border-right: 1px solid #1a1a2e;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem 0;
  gap: 0.25rem;
  flex-shrink: 0;
}
.sb-logo {
  width: 32px; height: 32px;
  border-radius: 8px;
  background: linear-gradient(135deg, #D4A017, #F0C040);
  margin-bottom: 1.25rem;
  display: flex; align-items: center; justify-content: center;
  font-weight: 800; font-size: 0.7rem; color: #000;
}
.sb-icon {
  width: 36px; height: 36px;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  color: #444; background: none; border: none;
  cursor: pointer; transition: all 0.15s;
  position: relative;
}
.sb-icon:hover { background: #1a1a2e; color: #888; }
.sb-icon.active { background: #1a1a2e; color: #D4A017; }
.sb-tooltip {
  display: none; position: absolute; left: 48px;
  background: #222; color: #fff;
  padding: 0.2rem 0.5rem; border-radius: 4px;
  font-size: 0.6rem; white-space: nowrap; z-index: 10;
}
.sb-icon:hover .sb-tooltip { display: block; }
.sb-badge {
  position: absolute; top: 4px; right: 4px;
  width: 8px; height: 8px; border-radius: 50%;
  background: #ef4444; border: 2px solid #0c0c14;
}
.sb-spacer { flex: 1; }
.sb-avatar {
  width: 30px; height: 30px; border-radius: 50%;
  background: linear-gradient(135deg, #333, #555);
  display: flex; align-items: center; justify-content: center;
  font-size: 0.55rem; color: #aaa; font-weight: 600;
}
```

- [ ] **Step 4: Verify files created**

```bash
ls -la src/components/Sidebar.*
```
Expected: Both files listed.

- [ ] **Step 5: Commit**

```bash
git add src/components/Sidebar.jsx src/components/Sidebar.css
git commit -m "feat: add Sidebar component with icon navigation"
```

---

## Task 2: Create Topbar component

**Files:**
- Create: `src/components/Topbar.jsx`
- Create: `src/components/Topbar.css`

- [ ] **Step 1: Write Topbar.jsx**

```jsx
import './Topbar.css'

const VIEW_TITLES = {
  pipeline: 'Pipeline',
  board: 'Board',
  resume: 'Resume',
  prep: 'Interview Prep',
  links: 'Links & Portfolio',
  settings: 'Settings',
}

export default function Topbar({ activeView, jobCount, searchRunning, onTriggerSearch, onToggleAutoApply, search, onSearchChange }) {
  return (
    <div className="topbar">
      <div className="topbar-left">
        <span className="topbar-title">{VIEW_TITLES[activeView] || 'Pipeline'}</span>
        {activeView === 'pipeline' && <span className="topbar-count">{jobCount} jobs</span>}
      </div>
      <input
        type="text"
        className="topbar-search"
        placeholder="Search jobs, companies..."
        value={search}
        onChange={e => onSearchChange(e.target.value)}
      />
      <div className="topbar-right">
        <button className="btn-auto-apply" onClick={onToggleAutoApply}>Auto-Apply</button>
        <button
          className={`btn-scan ${searchRunning ? 'running' : ''}`}
          onClick={onTriggerSearch}
          disabled={searchRunning}
        >
          {searchRunning ? 'Scanning...' : 'Scan Jobs'}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Write Topbar.css**

```css
.topbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0.75rem 1.25rem; border-bottom: 1px solid #1a1a2e; gap: 1rem;
}
.topbar-left { display: flex; align-items: center; gap: 0.75rem; }
.topbar-title { font-size: 0.9rem; font-weight: 600; color: #fff; }
.topbar-count {
  font-size: 0.65rem; color: #555; background: #1a1a2e;
  padding: 0.15rem 0.5rem; border-radius: 10px;
}
.topbar-search {
  flex: 1; max-width: 280px; padding: 0.4rem 0.75rem;
  border-radius: 8px; border: 1px solid #1a1a2e;
  background: #0c0c14; color: #e5e5e5; font-size: 0.75rem;
  font-family: 'Inter', sans-serif; outline: none;
}
.topbar-search:focus { border-color: #D4A017; }
.topbar-search::placeholder { color: #333; }
.topbar-right { display: flex; gap: 0.5rem; align-items: center; }
.btn-scan {
  padding: 0.4rem 1rem; border-radius: 8px; border: none;
  background: #D4A017; color: #000; font-weight: 600;
  font-size: 0.75rem; cursor: pointer; font-family: 'Inter', sans-serif;
  transition: all 0.2s;
}
.btn-scan:hover { background: #F0C040; }
.btn-scan.running { background: #555; color: #fff; animation: pulse 1.5s infinite; }
.btn-scan:disabled { cursor: not-allowed; opacity: 0.7; }
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
.btn-auto-apply {
  padding: 0.4rem 1rem; border-radius: 8px;
  border: 1.5px solid #D4A017; background: transparent;
  color: #D4A017; font-weight: 600; font-size: 0.75rem;
  cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.2s;
}
.btn-auto-apply:hover { background: #D4A017; color: #000; }
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Topbar.jsx src/components/Topbar.css
git commit -m "feat: add Topbar component"
```

---

## Task 3: Create StatsStrip and FilterBar components

**Files:**
- Create: `src/components/StatsStrip.jsx`
- Create: `src/components/FilterBar.jsx`

- [ ] **Step 1: Write StatsStrip.jsx**

```jsx
export default function StatsStrip({ stats, activeStatFilter, onStatClick }) {
  if (!stats) return null
  const items = [
    { key: 'all', label: 'Total', value: stats.total, color: '' },
    { key: 'tier_a', label: 'Tier A', value: stats.tier_a, color: 'gold' },
    { key: 'tier_b', label: 'Tier B', value: stats.tier_b, color: '' },
    { key: 'tier_c', label: 'Tier C', value: stats.tier_c, color: '' },
    { key: 'applied', label: 'Applied', value: stats.applied, color: 'green' },
    { key: 'interviewing', label: 'Interviews', value: stats.interviewing, color: 'cyan' },
    { key: 'offer', label: 'Offers', value: stats.offers, color: 'gold' },
  ]
  return (
    <div className="stats-strip">
      {items.map(item => (
        <button
          key={item.key}
          className={`ss-item ${activeStatFilter === item.key ? 'active' : ''}`}
          onClick={() => onStatClick(item.key)}
        >
          <span className={`ss-num ${item.color}`}>{item.value}</span>
          <span className="ss-label">{item.label}</span>
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Write FilterBar.jsx**

```jsx
export default function FilterBar({ sourceFilter, statusFilter, onSourceChange, onStatusChange }) {
  const sources = [
    ['all', 'All'], ['linkedin', 'LinkedIn'], ['greenhouse', 'Greenhouse'], ['lever', 'Lever'],
  ]
  const statuses = [
    ['all', 'All'], ['new', 'New'], ['saved', 'Saved'], ['applied', 'Applied'], ['interviewing', 'Interviews'],
  ]
  return (
    <div className="filter-bar">
      <div className="filter-group">
        {sources.map(([k, l]) => (
          <button key={k} className={`f-chip ${sourceFilter === k ? 'active' : ''}`} onClick={() => onSourceChange(k)}>{l}</button>
        ))}
      </div>
      <div className="f-divider" />
      <div className="filter-group">
        {statuses.map(([k, l]) => (
          <button key={k} className={`f-chip ${statusFilter === k ? 'active' : ''}`} onClick={() => onStatusChange(k)}>{l}</button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/StatsStrip.jsx src/components/FilterBar.jsx
git commit -m "feat: add StatsStrip and FilterBar components"
```

---

## Task 4: Create JobTable component

**Files:**
- Create: `src/components/JobTable.jsx`
- Create: `src/components/JobTable.css`

- [ ] **Step 1: Write JobTable.jsx**

```jsx
import './JobTable.css'

const tierColor = (tier) => tier === 'A' ? '#D4A017' : tier === 'B' ? '#888' : '#555'

const statusLabel = (s) => ({
  new: 'New', saved: 'Saved', applied: 'Applied',
  interviewing: 'Interview', rejected: 'Rejected', offer: 'Offer', hidden: 'Hidden',
}[s] || s)

const statusClass = (s) => ({
  applied: 'applied', interviewing: 'interview', new: 'new', saved: 'new', offer: 'offer',
}[s] || '')

export default function JobTable({ jobs, selectedJobId, onSelectJob }) {
  return (
    <div className="job-table">
      <div className="jt-header">
        <span className="jt-th">Position</span>
        <span className="jt-th">Company</span>
        <span className="jt-th">Score</span>
        <span className="jt-th">Status</span>
      </div>
      {jobs.map(job => (
        <div
          key={job.id}
          className={`jt-row ${selectedJobId === job.id ? 'selected' : ''}`}
          onClick={() => onSelectJob(job)}
        >
          <div>
            <div className="jt-title">{job.title}</div>
            <div className="jt-subtitle">{job.location || 'Remote'}</div>
          </div>
          <span className="jt-company">{job.company}</span>
          <div className="jt-score">
            <div className="jt-score-bar">
              <div className="jt-score-fill" style={{ width: `${job.fit_score}%`, background: tierColor(job.tier) }} />
            </div>
            <span className="jt-score-num">{job.fit_score}</span>
          </div>
          <span className={`jt-status ${statusClass(job.status)}`}>
            <span className="jt-status-dot" />
            {statusLabel(job.status)}
          </span>
        </div>
      ))}
      {jobs.length === 0 && <div className="jt-empty">No jobs match your filters</div>}
    </div>
  )
}
```

- [ ] **Step 2: Write JobTable.css**

```css
.job-table { flex: 1; overflow-y: auto; }
.job-table::-webkit-scrollbar { width: 3px; }
.job-table::-webkit-scrollbar-thumb { background: #222; border-radius: 2px; }

.jt-header {
  display: grid; grid-template-columns: 2.5fr 1fr 0.6fr 0.7fr;
  padding: 0.5rem 1rem; border-bottom: 1px solid #1a1a2e;
  position: sticky; top: 0; background: #0a0a0f; z-index: 2;
}
.jt-th {
  font-size: 0.55rem; color: #444; text-transform: uppercase;
  letter-spacing: 0.5px; font-weight: 600;
}
.jt-row {
  display: grid; grid-template-columns: 2.5fr 1fr 0.6fr 0.7fr;
  padding: 0.6rem 1rem; border-bottom: 1px solid #0f0f18;
  align-items: center; cursor: pointer; transition: background 0.1s;
}
.jt-row:hover { background: #0f0f18; }
.jt-row.selected { background: #12121e; border-left: 3px solid #D4A017; padding-left: calc(1rem - 3px); }

.jt-title { font-size: 0.78rem; color: #e5e5e5; font-weight: 500; }
.jt-subtitle { font-size: 0.6rem; color: #444; margin-top: 0.1rem; }
.jt-company { font-size: 0.7rem; color: #666; }

.jt-score { display: flex; align-items: center; gap: 0.3rem; }
.jt-score-bar { width: 32px; height: 4px; border-radius: 2px; background: #1a1a2e; overflow: hidden; }
.jt-score-fill { height: 100%; border-radius: 2px; }
.jt-score-num { font-size: 0.65rem; color: #666; font-weight: 600; }

.jt-status {
  font-size: 0.6rem; padding: 0.15rem 0.45rem; border-radius: 4px;
  font-weight: 500; display: inline-flex; align-items: center;
  gap: 0.25rem; width: fit-content;
}
.jt-status-dot { width: 5px; height: 5px; border-radius: 50%; background: #555; }
.jt-status.applied { background: #052e16; color: #4ade80; }
.jt-status.applied .jt-status-dot { background: #4ade80; }
.jt-status.interview { background: #083344; color: #22d3ee; }
.jt-status.interview .jt-status-dot { background: #22d3ee; }
.jt-status.new { background: #1a1a2e; color: #D4A017; }
.jt-status.new .jt-status-dot { background: #D4A017; }
.jt-status.offer { background: #3d2800; color: #F0C040; }
.jt-status.offer .jt-status-dot { background: #F0C040; }

.jt-empty { text-align: center; color: #333; padding: 3rem 1rem; font-size: 0.8rem; }
```

- [ ] **Step 3: Commit**

```bash
git add src/components/JobTable.jsx src/components/JobTable.css
git commit -m "feat: add JobTable component with sortable rows"
```

---

## Task 5: Extract JobDrawer from App.jsx

**Files:**
- Create: `src/components/JobDrawer.jsx`
- Create: `src/components/JobDrawer.css`

- [ ] **Step 1: Write JobDrawer.jsx**

Extract lines 343-425 from current App.jsx into a standalone component. This is the detail drawer that slides in from the right.

```jsx
import { useState } from 'react'
import './JobDrawer.css'

const tierColor = (tier) => tier === 'A' ? '#D4A017' : tier === 'B' ? '#888' : '#555'
const statusLabel = (s) => ({ new: 'New', saved: 'Saved', applied: 'Applied', interviewing: 'Interview', rejected: 'Rejected', offer: 'OFFER!', hidden: 'Hidden' }[s] || s)

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

export default function JobDrawer({ job, onClose, onUpdateStatus, onApply }) {
  const [tab, setTab] = useState('cover_letter')
  const [copied, setCopied] = useState(false)

  const copyText = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!job) return null

  return (
    <div className="drawer-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="drawer">
        <button className="drawer-close" onClick={onClose}>X</button>

        <div className="drawer-head">
          <span className="tbadge lg" style={{ background: tierColor(job.tier) }}>{job.tier}</span>
          <div>
            <h2>{job.title}</h2>
            <p className="drawer-company">{job.company}</p>
          </div>
          <span className="drawer-score">{job.fit_score}<small>/100</small></span>
        </div>

        <div className="drawer-meta">
          <div className="drawer-meta-row">
            <span className="drawer-label">Location</span>
            <span>{job.location || 'Remote'}</span>
          </div>
          <div className="drawer-meta-row">
            <span className="drawer-label">Source</span>
            <span>{job.source}</span>
          </div>
          <div className="drawer-meta-row">
            <span className="drawer-label">Apply Via</span>
            <span className="drawer-apply-method">{applyMethod(job)}</span>
          </div>
          {job.salary && (
            <div className="drawer-meta-row">
              <span className="drawer-label">Salary</span>
              <span className="jsalary">{job.salary}</span>
            </div>
          )}
          {job.date_posted && (
            <div className="drawer-meta-row">
              <span className="drawer-label">Posted</span>
              <span>{job.date_posted}</span>
            </div>
          )}
        </div>

        <div className="drawer-actions">
          {job.url && <a href={job.url} target="_blank" rel="noopener" className="btn-primary">View Posting</a>}
          {canAutoApply(job) && job.status !== 'applied' && (
            <button className="btn-apply" onClick={() => onApply(job.id)}>Auto-Apply</button>
          )}
          {!canAutoApply(job) && job.url && (
            <a href={job.url} target="_blank" rel="noopener" className="btn-manual">Go Apply Manually</a>
          )}
        </div>

        {job.match_reasons?.length > 0 && (
          <div className="drawer-section">
            <h4>Match Reasons</h4>
            <div className="jtags">{job.match_reasons.map((r, i) => <span key={i} className="jtag">{r}</span>)}</div>
          </div>
        )}

        <div className="drawer-section">
          <h4>Pipeline Status</h4>
          <div className="status-btns">
            {['new', 'saved', 'applied', 'interviewing', 'rejected', 'offer', 'hidden'].map(s => (
              <button key={s} className={`sbtn ${job.status === s ? 'active' : ''} s-${s}`}
                onClick={() => onUpdateStatus(job.id, s)}>
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
            <pre>{job[tab]}</pre>
            <button className="copy-btn" onClick={() => copyText(job[tab])}>{copied ? 'Copied!' : 'Copy'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Write JobDrawer.css**

Move lines 139-190 from current App.css (drawer styles) into this file. All `.drawer-*`, `.tbadge`, `.btn-primary`, `.btn-apply`, `.btn-manual`, `.jtags`, `.jtag`, `.status-btns`, `.sbtn`, `.outreach-*`, `.copy-btn` styles.

```css
.drawer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 100; display: flex; justify-content: flex-end; }
.drawer { width: 520px; max-width: 90vw; background: #0a0a0f; border-left: 1px solid #1a1a2e; padding: 1.5rem; overflow-y: auto; animation: slideIn 0.2s ease-out; position: relative; }
@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
.drawer-close { position: absolute; top: 1rem; right: 1rem; background: #1a1a2e; border: 1px solid #333; color: #888; width: 28px; height: 28px; border-radius: 6px; cursor: pointer; font-size: 0.8rem; display: flex; align-items: center; justify-content: center; }
.drawer-close:hover { color: #fff; border-color: #D4A017; }

.drawer-head { display: flex; align-items: flex-start; gap: 0.75rem; margin-bottom: 1.25rem; padding-right: 2rem; }
.tbadge.lg { width: 36px; height: 36px; font-size: 1rem; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; font-weight: 700; color: #000; flex-shrink: 0; }
.drawer-head h2 { font-size: 1.1rem; color: #fff; line-height: 1.3; }
.drawer-company { font-size: 0.82rem; color: #888; }
.drawer-score { margin-left: auto; font-size: 1.6rem; font-weight: 700; color: #D4A017; flex-shrink: 0; }
.drawer-score small { font-size: 0.7rem; color: #444; }

.drawer-meta { background: #111118; border: 1px solid #1a1a2e; border-radius: 8px; padding: 0.75rem; margin-bottom: 1rem; }
.drawer-meta-row { display: flex; justify-content: space-between; padding: 0.3rem 0; font-size: 0.8rem; border-bottom: 1px solid #1a1a2e; }
.drawer-meta-row:last-child { border-bottom: none; }
.drawer-label { color: #555; }
.drawer-apply-method { color: #D4A017; font-weight: 600; }
.jsalary { color: #D4A017; font-weight: 600; font-size: 0.75rem; }

.drawer-actions { display: flex; gap: 0.75rem; margin-bottom: 1.25rem; }
.btn-primary { padding: 0.5rem 1rem; border-radius: 6px; background: #1a1a2e; color: #fff; text-decoration: none; font-size: 0.82rem; font-weight: 600; border: 1px solid #333; transition: all 0.15s; }
.btn-primary:hover { border-color: #D4A017; }
.btn-apply { padding: 0.5rem 1rem; border-radius: 6px; border: 1.5px solid #D4A017; background: transparent; color: #D4A017; font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: all 0.15s; }
.btn-apply:hover { background: #D4A017; color: #000; }
.btn-manual { padding: 0.5rem 1rem; border-radius: 6px; border: 1px solid #333; background: #1a1a2e; color: #fff; font-size: 0.82rem; font-weight: 600; text-decoration: none; transition: all 0.15s; }
.btn-manual:hover { border-color: #D4A017; color: #D4A017; }

.drawer-section { margin-bottom: 1.25rem; }
.drawer-section h4 { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px; color: #444; margin-bottom: 0.4rem; }

.jtags { display: flex; flex-wrap: wrap; gap: 0.2rem; margin-top: 0.3rem; }
.jtag { font-size: 0.6rem; padding: 0.1rem 0.4rem; border-radius: 10px; background: rgba(212,160,23,0.1); color: #D4A017; border: 1px solid rgba(212,160,23,0.15); }

.status-btns { display: flex; gap: 0.25rem; flex-wrap: wrap; }
.sbtn { padding: 0.3rem 0.6rem; border-radius: 6px; border: 1px solid #1a1a2e; background: transparent; color: #555; font-size: 0.72rem; cursor: pointer; transition: all 0.15s; }
.sbtn:hover { border-color: #D4A017; color: #fff; }
.sbtn.active { border-color: #D4A017; color: #fff; background: #1a1a2e; }
.sbtn.active.s-applied { border-color: #4ade80; color: #4ade80; }
.sbtn.active.s-interviewing { border-color: #22d3ee; color: #22d3ee; }
.sbtn.active.s-offer { border-color: #F0C040; color: #F0C040; }
.sbtn.active.s-rejected { border-color: #ef4444; color: #fca5a5; }

.outreach-tabs { display: flex; border-bottom: 1px solid #1a1a2e; }
.otab { padding: 0.4rem 0.8rem; border: none; background: transparent; color: #555; font-size: 0.78rem; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.15s; }
.otab:hover { color: #fff; }
.otab.active { color: #D4A017; border-bottom-color: #D4A017; }

.outreach-body { position: relative; }
.outreach-body pre { background: #050508; border: 1px solid #1a1a2e; border-radius: 0 0 8px 8px; padding: 0.75rem; font-size: 0.78rem; line-height: 1.5; white-space: pre-wrap; color: #bbb; max-height: 280px; overflow-y: auto; font-family: 'Inter', sans-serif; }
.copy-btn { position: absolute; top: 0.4rem; right: 0.4rem; padding: 0.25rem 0.6rem; border-radius: 4px; border: 1px solid #1a1a2e; background: #111118; color: #888; font-size: 0.7rem; cursor: pointer; }
.copy-btn:hover { color: #D4A017; border-color: #D4A017; }

@media (max-width: 768px) { .drawer { width: 100vw; } }
```

- [ ] **Step 3: Commit**

```bash
git add src/components/JobDrawer.jsx src/components/JobDrawer.css
git commit -m "feat: extract JobDrawer component from App.jsx"
```

---

## Task 6: Extract AutoApplyPanel and BoardView from App.jsx

**Files:**
- Create: `src/components/AutoApplyPanel.jsx`
- Create: `src/components/BoardView.jsx`

- [ ] **Step 1: Write AutoApplyPanel.jsx**

Extract lines 194-273 from current App.jsx (the auto-apply panel with tier selection, progress, and results).

```jsx
import { useState } from 'react'

const tierColor = (tier) => tier === 'A' ? '#D4A017' : tier === 'B' ? '#888' : '#555'

export default function AutoApplyPanel({ show, onClose, onLaunch, applyRunning, applyProgress, applyResults }) {
  const [tiers, setTiers] = useState(['A', 'B'])
  const [maxApps, setMaxApps] = useState(5)

  if (!show) return null

  return (
    <div className="apply-panel">
      {!applyRunning && !applyResults && (
        <>
          <h3>AI Auto-Apply Agent</h3>
          <p className="apply-desc">Select which tiers to apply to, set a max, and launch. The agent will open each job, fill forms, upload your resume, and submit.</p>
          <div className="apply-controls">
            <div className="apply-setting">
              <label>Apply to:</label>
              <div className="filter-group">
                {['A', 'B', 'C'].map(t => (
                  <button key={t} className={`f-chip ${tiers.includes(t) ? 'active' : ''}`}
                    style={tiers.includes(t) ? { background: tierColor(t), color: '#000', borderColor: tierColor(t) } : {}}
                    onClick={() => setTiers(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])}>
                    Tier {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="apply-setting">
              <label>Max apps:</label>
              <select className="apply-select" value={maxApps} onChange={e => setMaxApps(Number(e.target.value))}>
                {[1, 3, 5, 10, 15, 25].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <button className="btn-scan" onClick={() => onLaunch(tiers, maxApps)} disabled={tiers.length === 0}>
              Launch Agent ({tiers.join(' + ')} tiers, max {maxApps})
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
            <div className="apply-done-stat success"><span className="apply-done-n">{applyResults.successful}</span><span>Applied</span></div>
            <div className="apply-done-stat fail"><span className="apply-done-n">{applyResults.failed}</span><span>Failed</span></div>
            <div className="apply-done-stat total"><span className="apply-done-n">{applyResults.total}</span><span>Total</span></div>
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
          <button className="btn-scan" style={{ marginTop: '0.75rem' }} onClick={onClose}>Done</button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Write BoardView.jsx**

Extract lines 298-340 from current App.jsx (the 3-column Kanban board).

```jsx
const tierColor = (tier) => tier === 'A' ? '#D4A017' : tier === 'B' ? '#888' : '#555'
const statusLabel = (s) => ({ new: 'New', saved: 'Saved', applied: 'Applied', interviewing: 'Interview', rejected: 'Rejected', offer: 'OFFER!', hidden: 'Hidden' }[s] || s)

const canAutoApply = (job) => {
  if (!job.url || !job.url.startsWith('http')) return false
  if (job.url.includes('remoteok.comhttps')) return false
  return true
}

function JobCard({ job, selectedJobId, onSelectJob }) {
  return (
    <div className={`jcard ${selectedJobId === job.id ? 'selected' : ''}`} onClick={() => onSelectJob(job)}>
      <div className="jcard-top">
        <span className="jscore-pill" style={{ background: tierColor(job.tier) }}>{job.fit_score}</span>
        {job.status !== 'new' && <span className={`jstatus s-${job.status}`}>{statusLabel(job.status)}</span>}
        <span className={`japply-method ${canAutoApply(job) ? 'auto' : 'manual'}`}>
          {canAutoApply(job) ? 'Auto' : 'Manual'}
        </span>
      </div>
      <h3 className="jcard-title">{job.title}</h3>
      <p className="jcard-company">{job.company}</p>
      {job.location && <p className="jcard-loc">{job.location}</p>}
      {job.salary && <p className="jsalary">{job.salary}</p>}
      {!canAutoApply(job) && job.url && (
        <a href={job.url} target="_blank" rel="noopener" className="jcard-link" onClick={e => e.stopPropagation()}>View & Apply</a>
      )}
      {job.match_reasons?.length > 0 && (
        <div className="jtags">{job.match_reasons.slice(0, 2).map((r, i) => <span key={i} className="jtag">{r}</span>)}</div>
      )}
    </div>
  )
}

export default function BoardView({ jobs, selectedJobId, onSelectJob }) {
  const tierA = jobs.filter(j => j.tier === 'A')
  const tierB = jobs.filter(j => j.tier === 'B')
  const tierC = jobs.filter(j => j.tier === 'C')

  return (
    <div className="board">
      {[
        { tier: 'A', label: 'Apply Now', jobs: tierA, color: '#D4A017' },
        { tier: 'B', label: 'Worth Pursuing', jobs: tierB, color: '#888' },
        { tier: 'C', label: 'Review', jobs: tierC, color: '#444' },
      ].map(col => (
        <div key={col.tier} className="board-col">
          <div className="board-header" style={{ borderColor: col.color }}>
            <span className="board-tier" style={{ color: col.color }}>TIER {col.tier}</span>
            <span className="board-count">{col.jobs.length}</span>
            <span className="board-label">{col.label}</span>
          </div>
          <div className="board-cards">
            {col.jobs.length === 0 && <p className="board-empty">No Tier {col.tier} matches yet</p>}
            {col.jobs.slice(0, col.tier === 'C' ? 50 : undefined).map(job => (
              <JobCard key={job.id} job={job} selectedJobId={selectedJobId} onSelectJob={onSelectJob} />
            ))}
            {col.tier === 'C' && col.jobs.length > 50 && <p className="board-more">+{col.jobs.length - 50} more</p>}
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/AutoApplyPanel.jsx src/components/BoardView.jsx
git commit -m "feat: extract AutoApplyPanel and BoardView components"
```

---

## Task 7: Create TrendingPanel component

**Files:**
- Create: `src/components/TrendingPanel.jsx`
- Create: `src/components/TrendingPanel.css`

- [ ] **Step 1: Write TrendingPanel.jsx**

```jsx
import { useState, useEffect } from 'react'
import './TrendingPanel.css'

const MOCK_TWEETS = [
  { id: 1, name: 'Anthropic', handle: '@AnthropicAI', avatar: '#1d9bf0', time: '2h', body: '<b>Claude Code</b> now supports autonomous multi-file editing with tool use.', tags: [{ label: 'AI', color: 'ai' }, { label: 'Claude', color: 'claude' }], likes: '4.8K', retweets: '1.2K', comments: '342' },
  { id: 2, name: 'Lenny Rachitsky', handle: '@lennysan', avatar: '#666', time: '5h', body: 'The best <b>VP of Marketing</b> hires all had one thing in common: they could tie every campaign back to revenue within 48 hours.', tags: [{ label: 'Career', color: 'career' }], likes: '2.1K', retweets: '410', comments: '89' },
  { id: 3, name: 'Devin AI', handle: '@cognition', avatar: '#7c3aed', time: '8h', body: 'Marketing teams using <b>AI agents</b> for competitive analysis are shipping campaigns 3x faster.', tags: [{ label: 'AI', color: 'ai' }, { label: 'MarTech', color: 'tech' }], likes: '890', retweets: '203', comments: '56' },
]

const MOCK_NEWS = [
  { id: 1, source: 'TechCrunch', title: 'AI-powered job platforms see 300% surge in VP-level placements', time: '45 min ago', readTime: '3 min' },
  { id: 2, source: 'The Verge', title: 'Claude 4.5 benchmarks show major gains in code generation', time: '2h ago', readTime: '5 min' },
]

export default function TrendingPanel({ collapsed, onToggleCollapse }) {
  const [tab, setTab] = useState('x')
  const [trending, setTrending] = useState(null)

  useEffect(() => {
    fetch('/api/trending')
      .then(r => r.json())
      .then(setTrending)
      .catch(() => setTrending({ tweets: MOCK_TWEETS, news: MOCK_NEWS }))
  }, [])

  const data = trending || { tweets: MOCK_TWEETS, news: MOCK_NEWS }

  if (collapsed) return null

  return (
    <div className="trending-panel">
      <div className="tp-header">
        <div className="tp-title">
          <div className="tp-live" />
          Trending
        </div>
        <button className="tp-collapse" onClick={onToggleCollapse} title="Collapse">‹</button>
      </div>
      <div className="tp-tabs">
        <button className={`tp-tab ${tab === 'x' ? 'active' : ''}`} onClick={() => setTab('x')}>𝕏 / AI</button>
        <button className={`tp-tab ${tab === 'news' ? 'active' : ''}`} onClick={() => setTab('news')}>News</button>
        <button className={`tp-tab ${tab === 'hn' ? 'active' : ''}`} onClick={() => setTab('hn')}>HN</button>
      </div>
      <div className="tp-feed">
        {tab === 'x' && data.tweets.map(t => (
          <div key={t.id} className="tweet">
            <div className="tweet-header">
              <div className="tweet-avatar" style={{ background: t.avatar }} />
              <div>
                <div className="tweet-name">{t.name}</div>
                <div className="tweet-handle">{t.handle}</div>
              </div>
              <span className="tweet-time">{t.time}</span>
            </div>
            <div className="tweet-body" dangerouslySetInnerHTML={{ __html: t.body }} />
            <div className="tweet-tags">
              {t.tags.map((tag, i) => <span key={i} className={`tweet-tag ${tag.color}`}>{tag.label}</span>)}
            </div>
            <div className="tweet-engagement">
              <span>💬 {t.comments}</span>
              <span>🔄 {t.retweets}</span>
              <span>❤️ {t.likes}</span>
            </div>
          </div>
        ))}
        {tab === 'news' && data.news.map(n => (
          <div key={n.id} className="news-item">
            <div className="news-source">{n.source}</div>
            <div className="news-title">{n.title}</div>
            <div className="news-meta">{n.time} · {n.readTime} read</div>
          </div>
        ))}
        {tab === 'hn' && <div className="tp-placeholder">HN feed coming soon</div>}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Write TrendingPanel.css**

```css
.trending-panel {
  width: 260px; background: #0c0c14;
  border-right: 1px solid #1a1a2e;
  display: flex; flex-direction: column;
  overflow-y: auto; flex-shrink: 0;
}
.trending-panel::-webkit-scrollbar { width: 3px; }
.trending-panel::-webkit-scrollbar-thumb { background: #222; border-radius: 2px; }

.tp-header {
  padding: 0.75rem 1rem; border-bottom: 1px solid #1a1a2e;
  display: flex; align-items: center; justify-content: space-between;
  position: sticky; top: 0; background: #0c0c14; z-index: 2;
}
.tp-title {
  font-size: 0.65rem; color: #444; text-transform: uppercase;
  letter-spacing: 1px; font-weight: 600;
  display: flex; align-items: center; gap: 0.4rem;
}
.tp-live {
  width: 6px; height: 6px; border-radius: 50%; background: #4ade80;
  animation: livePulse 2s infinite;
}
@keyframes livePulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
.tp-collapse {
  background: none; border: none; color: #444; cursor: pointer;
  font-size: 1rem; padding: 0.2rem; transition: color 0.15s;
}
.tp-collapse:hover { color: #888; }

.tp-tabs { display: flex; border-bottom: 1px solid #1a1a2e; }
.tp-tab {
  flex: 1; padding: 0.45rem 0.5rem; font-size: 0.6rem; color: #444;
  text-align: center; cursor: pointer; border: none; background: none;
  border-bottom: 2px solid transparent; transition: all 0.15s;
  font-family: 'Inter', sans-serif;
}
.tp-tab:hover { color: #888; }
.tp-tab.active { color: #1d9bf0; border-bottom-color: #1d9bf0; }

.tp-feed { padding: 0.5rem; }
.tp-placeholder { text-align: center; color: #333; padding: 2rem 0.5rem; font-size: 0.75rem; }

/* Tweet card */
.tweet {
  background: #111118; border: 1px solid #1a1a2e; border-radius: 10px;
  padding: 0.75rem; margin-bottom: 0.5rem; cursor: pointer; transition: all 0.15s;
}
.tweet:hover { border-color: #252540; background: #14141e; }
.tweet-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.4rem; }
.tweet-avatar { width: 24px; height: 24px; border-radius: 50%; flex-shrink: 0; }
.tweet-name { font-size: 0.68rem; color: #ddd; font-weight: 600; }
.tweet-handle { font-size: 0.6rem; color: #444; }
.tweet-time { font-size: 0.55rem; color: #333; margin-left: auto; }
.tweet-body { font-size: 0.7rem; color: #999; line-height: 1.55; margin-bottom: 0.4rem; }
.tweet-body b { color: #ccc; }
.tweet-tags { margin-bottom: 0.3rem; }
.tweet-tag {
  display: inline-block; font-size: 0.55rem; padding: 0.1rem 0.4rem;
  border-radius: 4px; margin-right: 0.2rem;
}
.tweet-tag.ai { background: rgba(168,139,250,0.15); color: #a78bfa; }
.tweet-tag.claude { background: rgba(212,160,23,0.15); color: #D4A017; }
.tweet-tag.career { background: rgba(34,211,238,0.15); color: #22d3ee; }
.tweet-tag.tech { background: rgba(74,222,128,0.15); color: #4ade80; }
.tweet-engagement { display: flex; gap: 1rem; font-size: 0.55rem; color: #333; }

/* News card */
.news-item {
  background: #111118; border: 1px solid #1a1a2e; border-radius: 10px;
  padding: 0.65rem 0.75rem; margin-bottom: 0.5rem; cursor: pointer; transition: all 0.15s;
}
.news-item:hover { border-color: #252540; }
.news-source { font-size: 0.55rem; color: #f97316; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.25rem; }
.news-title { font-size: 0.7rem; color: #ccc; font-weight: 500; line-height: 1.4; margin-bottom: 0.25rem; }
.news-meta { font-size: 0.55rem; color: #333; }

@media (max-width: 1100px) { .trending-panel { display: none; } }
```

- [ ] **Step 3: Commit**

```bash
git add src/components/TrendingPanel.jsx src/components/TrendingPanel.css
git commit -m "feat: add TrendingPanel with X/AI, News, HN tabs"
```

---

## Task 8: Create ContextPanel component

**Files:**
- Create: `src/components/ContextPanel.jsx`
- Create: `src/components/ContextPanel.css`

- [ ] **Step 1: Write ContextPanel.jsx**

```jsx
import { useState, useEffect } from 'react'
import './ContextPanel.css'

const FALLBACK_INSIGHTS = [
  { icon: '💡', title: "Today's Tip", body: 'Focus on following up with your most recent applications. Personalized follow-ups within 5 business days increase response rates.' },
  { icon: '📊', title: 'Pattern', body: 'Roles with "Director" or "VP" in the title tend to score higher for your profile. Lean into these keywords.' },
]

const FALLBACK_QUESTIONS = [
  { text: 'Describe a time you launched a product in a competitive market. What was your GTM strategy?', tag: 'Behavioral — GTM' },
  { text: 'How do you measure the ROI of a brand campaign vs. performance marketing?', tag: 'Strategic — Measurement' },
]

const FALLBACK_LINKS = [
  { icon: '📄', title: 'Resume', sub: 'Upload your resume' },
  { icon: '🌐', title: 'Portfolio', sub: 'Add your portfolio URL' },
  { icon: '💼', title: 'LinkedIn', sub: 'Add your LinkedIn' },
  { icon: '🐙', title: 'GitHub', sub: 'Add your GitHub' },
]

export default function ContextPanel({ activity }) {
  const [insights, setInsights] = useState(FALLBACK_INSIGHTS)
  const [questions, setQuestions] = useState(FALLBACK_QUESTIONS)
  const [links, setLinks] = useState(FALLBACK_LINKS)

  useEffect(() => {
    fetch('/api/insights').then(r => r.json()).then(d => d.length && setInsights(d)).catch(() => {})
    fetch('/api/interview-prep').then(r => r.json()).then(d => d.length && setQuestions(d)).catch(() => {})
    fetch('/api/profile/links').then(r => r.json()).then(d => d.length && setLinks(d)).catch(() => {})
  }, [])

  return (
    <div className="context-panel">
      {/* AI Insights */}
      <div className="cp-section">
        <div className="cp-label"><span className="cp-dot" style={{ background: '#D4A017' }} /> AI Insights</div>
        {insights.map((ins, i) => (
          <div key={i} className="insight-card">
            <div className="insight-title"><span>{ins.icon}</span> {ins.title}</div>
            <div className="insight-body">{ins.body}</div>
          </div>
        ))}
      </div>

      {/* Interview Prep */}
      <div className="cp-section">
        <div className="cp-label"><span className="cp-dot" style={{ background: '#a78bfa' }} /> Interview Prep</div>
        {questions.map((q, i) => (
          <div key={i} className="prep-q">
            <div className="prep-q-text">"{q.text}"</div>
            <span className="prep-q-tag">{q.tag}</span>
          </div>
        ))}
      </div>

      {/* Quick Access */}
      <div className="cp-section">
        <div className="cp-label"><span className="cp-dot" style={{ background: '#f97316' }} /> Quick Access</div>
        {links.map((lnk, i) => (
          <div key={i} className="qlink">
            <div className="qlink-icon">{lnk.icon}</div>
            <div>
              <div className="qlink-text">{lnk.title}</div>
              <div className="qlink-sub">{lnk.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Activity */}
      <div className="cp-section">
        <div className="cp-label"><span className="cp-dot" style={{ background: '#22d3ee' }} /> Activity</div>
        {(activity || []).slice(0, 5).map((a, i) => (
          <div key={i} className="act-item">
            <span className={`act-dot ${a.type}`} />
            <span className="act-msg">{a.message}</span>
            <span className="act-time">{new Date(a.created_at + 'Z').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Write ContextPanel.css**

```css
.context-panel {
  width: 300px; background: #0c0c14;
  border-left: 1px solid #1a1a2e;
  display: flex; flex-direction: column;
  overflow-y: auto; flex-shrink: 0;
}
.context-panel::-webkit-scrollbar { width: 3px; }
.context-panel::-webkit-scrollbar-thumb { background: #222; border-radius: 2px; }

.cp-section { padding: 0.85rem 1rem; border-bottom: 1px solid #1a1a2e; }
.cp-section:last-child { border-bottom: none; }
.cp-label {
  font-size: 0.55rem; color: #444; text-transform: uppercase;
  letter-spacing: 1px; font-weight: 600; margin-bottom: 0.5rem;
  display: flex; align-items: center; gap: 0.4rem;
}
.cp-dot { width: 6px; height: 6px; border-radius: 50%; }

.insight-card {
  background: #111118; border: 1px solid #1a1a2e;
  border-radius: 8px; padding: 0.65rem; margin-bottom: 0.4rem;
}
.insight-card:last-child { margin-bottom: 0; }
.insight-title { font-size: 0.68rem; color: #ccc; font-weight: 600; margin-bottom: 0.2rem; display: flex; align-items: center; gap: 0.3rem; }
.insight-body { font-size: 0.65rem; color: #666; line-height: 1.5; }

.prep-q {
  background: #111118; border: 1px solid #1a1a2e;
  border-left: 3px solid #a78bfa;
  border-radius: 0 8px 8px 0;
  padding: 0.55rem 0.65rem; margin-bottom: 0.35rem;
}
.prep-q:last-child { margin-bottom: 0; }
.prep-q-text { font-size: 0.65rem; color: #bbb; line-height: 1.5; font-style: italic; }
.prep-q-tag { font-size: 0.5rem; color: #a78bfa; margin-top: 0.2rem; display: inline-block; }

.qlink {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.4rem 0.5rem; border-radius: 6px;
  cursor: pointer; transition: background 0.15s; margin-bottom: 0.15rem;
}
.qlink:hover { background: #111118; }
.qlink-icon {
  width: 26px; height: 26px; border-radius: 6px;
  background: #1a1a2e; display: flex; align-items: center; justify-content: center;
  font-size: 0.65rem;
}
.qlink-text { font-size: 0.7rem; color: #aaa; }
.qlink-sub { font-size: 0.52rem; color: #444; }

.act-item { display: flex; align-items: center; gap: 0.4rem; padding: 0.3rem 0; }
.act-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; background: #555; }
.act-dot.search { background: #D4A017; }
.act-dot.status { background: #4ade80; }
.act-dot.apply { background: #4ade80; }
.act-dot.error { background: #ef4444; }
.act-msg { font-size: 0.62rem; color: #555; flex: 1; }
.act-time { font-size: 0.52rem; color: #333; }

@media (max-width: 1100px) { .context-panel { display: none; } }
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ContextPanel.jsx src/components/ContextPanel.css
git commit -m "feat: add ContextPanel with insights, prep, links, activity"
```

---

## Task 9: Add backend API endpoints

**Files:**
- Create: `backend/src/routes/trending.js`
- Create: `backend/src/routes/insights.js`
- Create: `backend/src/routes/interview-prep.js`
- Create: `backend/src/routes/profile.js`
- Modify: `backend/src/server.js`

- [ ] **Step 1: Write backend/src/routes/trending.js**

```js
const express = require('express');
const router = express.Router();

const MOCK_TWEETS = [
  { id: 1, name: 'Anthropic', handle: '@AnthropicAI', avatar: '#1d9bf0', time: '2h', body: '<b>Claude Code</b> now supports autonomous multi-file editing with tool use.', tags: [{ label: 'AI', color: 'ai' }, { label: 'Claude', color: 'claude' }], likes: '4.8K', retweets: '1.2K', comments: '342' },
  { id: 2, name: 'Lenny Rachitsky', handle: '@lennysan', avatar: '#666', time: '5h', body: 'The best <b>VP of Marketing</b> hires all had one thing in common: they could tie every campaign back to revenue within 48 hours.', tags: [{ label: 'Career', color: 'career' }], likes: '2.1K', retweets: '410', comments: '89' },
  { id: 3, name: 'Devin AI', handle: '@cognition', avatar: '#7c3aed', time: '8h', body: 'Marketing teams using <b>AI agents</b> for competitive analysis are shipping campaigns 3x faster.', tags: [{ label: 'AI', color: 'ai' }, { label: 'MarTech', color: 'tech' }], likes: '890', retweets: '203', comments: '56' },
];

const MOCK_NEWS = [
  { id: 1, source: 'TechCrunch', title: 'AI-powered job platforms see 300% surge in VP-level placements', time: '45 min ago', readTime: '3 min' },
  { id: 2, source: 'The Verge', title: 'Claude 4.5 benchmarks show major gains in code generation', time: '2h ago', readTime: '5 min' },
];

router.get('/', (req, res) => {
  res.json({ tweets: MOCK_TWEETS, news: MOCK_NEWS });
});

module.exports = router;
```

- [ ] **Step 2: Write backend/src/routes/insights.js**

```js
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json([
    { icon: '💡', title: "Today's Tip", body: 'Focus on following up with your most recent applications. Personalized follow-ups within 5 business days increase response rates.' },
    { icon: '📊', title: 'Pattern', body: 'Roles with "Director" or "VP" in the title tend to score higher for your profile. Lean into these keywords.' },
  ]);
});

module.exports = router;
```

- [ ] **Step 3: Write backend/src/routes/interview-prep.js**

```js
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json([
    { text: 'Describe a time you launched a product in a competitive market. What was your GTM strategy?', tag: 'Behavioral — GTM' },
    { text: 'How do you measure the ROI of a brand campaign vs. performance marketing?', tag: 'Strategic — Measurement' },
    { text: 'Tell me about a cross-functional initiative you led that drove measurable revenue impact.', tag: 'Behavioral — Leadership' },
  ]);
});

module.exports = router;
```

- [ ] **Step 4: Write backend/src/routes/profile.js**

```js
const express = require('express');
const router = express.Router();

let userLinks = [
  { icon: '📄', title: 'Resume', sub: 'Sonny_Gonzalez_VP_Marketing.pdf', url: '' },
  { icon: '🌐', title: 'Portfolio', sub: 'aiforroi.co', url: 'https://aiforroi.co' },
  { icon: '💼', title: 'LinkedIn', sub: 'linkedin.com/in/sonnygonzalez', url: 'https://linkedin.com/in/sonnygonzalez' },
  { icon: '🐙', title: 'GitHub', sub: 'github.com/sgonz24', url: 'https://github.com/sgonz24' },
];

router.get('/', (req, res) => {
  res.json(userLinks);
});

router.put('/', (req, res) => {
  userLinks = req.body;
  res.json(userLinks);
});

module.exports = router;
```

- [ ] **Step 5: Mount routes in server.js**

Add these 4 lines after the existing route definitions in `backend/src/server.js`, before the cron section (around line 158):

```js
app.use('/api/trending', require('./routes/trending'));
app.use('/api/insights', require('./routes/insights'));
app.use('/api/interview-prep', require('./routes/interview-prep'));
app.use('/api/profile/links', require('./routes/profile'));
```

- [ ] **Step 6: Create the routes directory**

```bash
mkdir -p /Users/sonnygonzalezsolartech/job-search-app/backend/src/routes
```

- [ ] **Step 7: Commit**

```bash
cd /Users/sonnygonzalezsolartech/job-search-app
git add backend/src/routes/ backend/src/server.js
git commit -m "feat: add trending, insights, interview-prep, profile API endpoints"
```

---

## Task 10: Rewrite App.jsx as layout shell

**Files:**
- Modify: `src/App.jsx` (full rewrite)
- Modify: `src/App.css` (full rewrite)
- Modify: `src/index.css` (minor update)

This is the integration task — wire all components together.

- [ ] **Step 1: Write the new App.jsx**

```jsx
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
    else if (key === 'tier_a') { setStatusFilter('all') }
    else if (key === 'tier_b') { setStatusFilter('all') }
    else if (key === 'tier_c') { setStatusFilter('all') }
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
        return <div className="placeholder-view"><h2>Links & Portfolio</h2><p>Coming soon — manage your web presence links.</p></div>
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
```

- [ ] **Step 2: Write the new App.css**

```css
/* ═══ Layout Shell ═══ */
.app-shell { display: flex; height: 100vh; overflow: hidden; }
.app-main { flex: 1; display: flex; flex-direction: column; min-width: 0; }

.content-grid { flex: 1; display: flex; min-height: 0; overflow: hidden; }
.center-content { flex: 1; display: flex; flex-direction: column; min-width: 0; position: relative; }

.pipeline { flex: 1; display: flex; flex-direction: column; min-height: 0; }

/* ── Stats Strip ── */
.stats-strip { display: flex; border-bottom: 1px solid #1a1a2e; }
.ss-item {
  flex: 1; padding: 0.65rem 0.5rem;
  display: flex; flex-direction: column; align-items: center;
  border-right: 1px solid #1a1a2e; cursor: pointer;
  transition: background 0.15s; background: none; border-top: none; border-bottom: none; border-left: none;
  font-family: 'Inter', sans-serif;
}
.ss-item:last-child { border-right: none; }
.ss-item:hover { background: #0f0f18; }
.ss-item.active { background: #0f0f18; box-shadow: inset 0 -2px 0 #D4A017; }
.ss-num { font-size: 1.1rem; font-weight: 700; color: #fff; }
.ss-num.gold { color: #D4A017; }
.ss-num.green { color: #4ade80; }
.ss-num.cyan { color: #22d3ee; }
.ss-label { font-size: 0.55rem; color: #444; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 0.1rem; }

/* ── Filter Bar ── */
.filter-bar {
  display: flex; align-items: center; gap: 0.4rem;
  padding: 0.5rem 1rem; border-bottom: 1px solid #1a1a2e; flex-wrap: wrap;
}
.filter-group { display: flex; gap: 0.25rem; }
.f-chip {
  padding: 0.2rem 0.55rem; border-radius: 6px; font-size: 0.65rem;
  color: #555; border: 1px solid #1a1a2e; cursor: pointer;
  transition: all 0.15s; background: transparent; font-family: 'Inter', sans-serif;
}
.f-chip:hover { border-color: #333; color: #888; }
.f-chip.active { background: #1a1a2e; color: #fff; border-color: #D4A017; }
.f-divider { width: 1px; height: 16px; background: #1a1a2e; margin: 0 0.25rem; }

/* ── Trending Expand Button ── */
.trending-expand {
  position: absolute; left: 0; top: 50%;
  transform: translateY(-50%);
  background: #1a1a2e; border: 1px solid #252540;
  color: #666; cursor: pointer; padding: 0.5rem 0.15rem;
  border-radius: 0 6px 6px 0; font-size: 0.9rem; z-index: 5;
  transition: all 0.15s;
}
.trending-expand:hover { color: #D4A017; border-color: #D4A017; }

/* ── Auto-Apply Panel (inline) ── */
.apply-panel {
  background: #0a0a0f; border-bottom: 1.5px solid #D4A017;
  padding: 1.25rem; margin: 0;
}
.apply-panel h3 { font-size: 1rem; color: #D4A017; margin-bottom: 0.4rem; }
.apply-desc { font-size: 0.78rem; color: #555; margin-bottom: 0.75rem; line-height: 1.5; }
.apply-controls { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
.apply-setting { display: flex; align-items: center; gap: 0.4rem; }
.apply-setting label { font-size: 0.8rem; color: #888; }
.apply-select {
  padding: 0.3rem 0.5rem; border-radius: 6px;
  border: 1px solid #1a1a2e; background: #0c0c14;
  color: #e5e5e5; font-size: 0.82rem;
}

.apply-live { text-align: center; }
.apply-live-header { display: flex; align-items: center; justify-content: center; gap: 0.6rem; margin-bottom: 0.75rem; }
.apply-live-header h3 { color: #D4A017; font-size: 1rem; }
.apply-pulse { width: 10px; height: 10px; border-radius: 50%; background: #D4A017; animation: applyPulse 1.2s infinite; }
@keyframes applyPulse { 0%,100% { opacity: 1; box-shadow: 0 0 0 0 rgba(212,160,23,0.4); } 50% { opacity: 0.6; box-shadow: 0 0 0 8px rgba(212,160,23,0); } }
.apply-progress-bar { height: 6px; background: #1a1a2e; border-radius: 3px; overflow: hidden; margin-bottom: 0.75rem; }
.apply-progress-fill { height: 100%; background: #D4A017; border-radius: 3px; transition: width 0.5s ease; min-width: 4%; }
.apply-live-status { font-size: 0.82rem; color: #ccc; margin-bottom: 0.3rem; }
.apply-live-hint { font-size: 0.72rem; color: #444; }

.apply-done h3 { color: #fff; font-size: 1rem; margin-bottom: 0.75rem; }
.apply-done-stats { display: flex; gap: 1rem; margin-bottom: 1rem; justify-content: center; }
.apply-done-stat { display: flex; flex-direction: column; align-items: center; padding: 0.6rem 1.25rem; border-radius: 8px; background: #111118; border: 1px solid #1a1a2e; min-width: 80px; }
.apply-done-stat.success { border-color: #052e16; }
.apply-done-stat.success .apply-done-n { color: #4ade80; }
.apply-done-stat.fail { border-color: #2a0a0a; }
.apply-done-stat.fail .apply-done-n { color: #fca5a5; }
.apply-done-stat.total .apply-done-n { color: #D4A017; }
.apply-done-n { font-size: 1.5rem; font-weight: 700; }
.apply-done-stat span:last-child { font-size: 0.7rem; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
.apply-done-list { display: flex; flex-direction: column; gap: 0.3rem; margin-top: 0.75rem; }
.apply-done-item { display: flex; align-items: center; gap: 0.6rem; font-size: 0.78rem; padding: 0.4rem 0.6rem; border-radius: 6px; background: #111118; border: 1px solid #1a1a2e; }
.apply-done-item.ok { border-left: 3px solid #4ade80; }
.apply-done-item.err { border-left: 3px solid #ef4444; }
.apply-done-icon { font-size: 0.7rem; font-weight: 600; min-width: 50px; }
.apply-done-item.ok .apply-done-icon { color: #4ade80; }
.apply-done-item.err .apply-done-icon { color: #ef4444; }
.apply-done-job { flex: 1; color: #ccc; }
.apply-done-fields { color: #555; font-size: 0.7rem; }
.apply-done-err { color: #ef4444; font-size: 0.68rem; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* ── Board View ── */
.board { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; padding: 1rem; flex: 1; overflow-y: auto; }
.board-col { display: flex; flex-direction: column; }
.board-header { padding: 0.75rem 1rem; background: #0c0c14; border: 1px solid #1a1a2e; border-top: 3px solid; border-radius: 8px 8px 0 0; display: flex; align-items: center; gap: 0.5rem; }
.board-tier { font-size: 0.75rem; font-weight: 700; letter-spacing: 1px; }
.board-count { font-size: 0.7rem; background: #1a1a2e; color: #888; padding: 0.1rem 0.45rem; border-radius: 10px; }
.board-label { font-size: 0.7rem; color: #444; margin-left: auto; }
.board-cards { flex: 1; display: flex; flex-direction: column; gap: 0.4rem; padding: 0.5rem; background: #050508; border: 1px solid #1a1a2e; border-top: none; border-radius: 0 0 8px 8px; max-height: 70vh; overflow-y: auto; }
.board-cards::-webkit-scrollbar { width: 3px; }
.board-cards::-webkit-scrollbar-thumb { background: #222; border-radius: 2px; }
.board-empty { color: #333; font-size: 0.8rem; text-align: center; padding: 2rem 0; }
.board-more { color: #444; font-size: 0.75rem; text-align: center; padding: 0.5rem; }

/* ── Job Card (Board view) ── */
.jcard { background: #0c0c14; border-radius: 6px; padding: 0.75rem; cursor: pointer; border: 1px solid #1a1a2e; transition: all 0.15s; }
.jcard:hover { border-color: #252540; transform: translateY(-1px); }
.jcard.selected { border-color: #D4A017; background: #111118; }
.jcard-top { display: flex; align-items: center; gap: 0.4rem; margin-bottom: 0.3rem; }
.jscore-pill { font-size: 0.65rem; font-weight: 700; color: #000; padding: 0.15rem 0.45rem; border-radius: 10px; }
.jstatus { font-size: 0.6rem; padding: 0.1rem 0.4rem; border-radius: 4px; background: #1a1a2e; color: #888; }
.jstatus.s-applied { background: #052e16; color: #4ade80; }
.jstatus.s-interviewing { background: #083344; color: #22d3ee; }
.jstatus.s-offer { background: #3d2800; color: #F0C040; }
.jstatus.s-saved { background: #1a1a2e; color: #D4A017; }
.japply-method { font-size: 0.6rem; color: #444; margin-left: auto; padding: 0.1rem 0.35rem; border-radius: 4px; border: 1px solid #1a1a2e; }
.japply-method.auto { color: #4ade80; border-color: #052e16; background: #052e16; }
.jcard-title { font-size: 0.85rem; font-weight: 600; color: #e5e5e5; line-height: 1.25; }
.jcard-company { font-size: 0.75rem; color: #888; margin: 0.1rem 0; }
.jcard-loc { font-size: 0.7rem; color: #444; }
.jcard-link { display: inline-block; font-size: 0.7rem; color: #D4A017; text-decoration: none; margin-top: 0.3rem; padding: 0.2rem 0.5rem; border: 1px solid rgba(212,160,23,0.3); border-radius: 4px; transition: all 0.15s; }
.jcard-link:hover { background: #D4A017; color: #000; }

/* ── Placeholder Views ── */
.placeholder-view { padding: 3rem 2rem; text-align: center; }
.placeholder-view h2 { font-size: 1.2rem; color: #fff; margin-bottom: 0.5rem; }
.placeholder-view p { color: #555; font-size: 0.85rem; }

/* ── Footer ── */
.powered-by { text-align: center; padding: 0.75rem; border-top: 1px solid #1a1a2e; font-size: 0.7rem; color: #333; }
.powered-by a { color: #D4A017; text-decoration: none; font-weight: 600; }

/* ── Responsive ── */
@media (max-width: 1100px) {
  .content-grid { flex-direction: column; }
}
@media (max-width: 768px) {
  .app-shell { flex-direction: column; }
  .sidebar { width: 100%; height: 56px; flex-direction: row; padding: 0 0.5rem; order: 1; border-right: none; border-top: 1px solid #1a1a2e; }
  .sb-logo { margin-bottom: 0; margin-right: 0.5rem; }
  .sb-spacer { display: none; }
  .sb-avatar { margin-left: auto; }
  .board { grid-template-columns: 1fr; }
}
```

- [ ] **Step 3: Update index.css**

```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body, #root { height: 100%; }
body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background: #09090b; color: #e5e5e5; line-height: 1.5; -webkit-font-smoothing: antialiased; }
```

- [ ] **Step 4: Verify the app builds**

```bash
cd /Users/sonnygonzalezsolartech/job-search-app/frontend && npm run build
```

Expected: Build completes with no errors.

- [ ] **Step 5: Commit**

```bash
git add src/App.jsx src/App.css src/index.css
git commit -m "feat: rewrite App.jsx as 3-panel layout shell with all components wired"
```

---

## Task 11: Smoke test and fix

- [ ] **Step 1: Start dev server and verify**

```bash
cd /Users/sonnygonzalezsolartech/job-search-app/frontend && npm run dev
```

Open http://localhost:5173 and verify:
- Sidebar renders with 6 icons
- Pipeline view shows stats strip, filter bar, job table
- Trending panel shows on left with mock data
- Context panel shows on right with insights, prep, links
- Clicking a job row opens the detail drawer
- Board view accessible from sidebar
- Auto-Apply button opens the panel
- Scan Jobs button triggers search

- [ ] **Step 2: Fix any build or runtime errors**

Address any issues found during smoke test.

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "fix: smoke test fixes for JobHQ redesign"
```

---

## Task 12: Deploy to Vercel

- [ ] **Step 1: Build production bundle**

```bash
cd /Users/sonnygonzalezsolartech/job-search-app/frontend && npm run build
```

- [ ] **Step 2: Deploy**

```bash
cd /Users/sonnygonzalezsolartech/job-search-app/frontend && npx vercel deploy --prod --yes
```

- [ ] **Step 3: Verify live site**

Open the Vercel URL and confirm all panels render correctly.

- [ ] **Step 4: Commit any deploy config changes**

```bash
git add -A && git commit -m "chore: deploy JobHQ redesign to Vercel"
```
