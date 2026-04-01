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
