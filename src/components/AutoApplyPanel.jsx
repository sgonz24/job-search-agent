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
