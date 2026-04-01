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
