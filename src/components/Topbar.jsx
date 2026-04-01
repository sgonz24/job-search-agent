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
