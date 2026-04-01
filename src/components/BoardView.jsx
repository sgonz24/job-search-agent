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
        <a href={job.url} target="_blank" rel="noopener noreferrer" className="jcard-link" onClick={e => e.stopPropagation()}>View & Apply</a>
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
