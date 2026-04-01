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
