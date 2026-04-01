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
