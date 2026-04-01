import { useState } from 'react'
import './ResumeView.css'

const RESUME_TIPS = [
  { icon: '🎯', title: 'Tailor for Each Role', body: 'Customize your summary and top skills to match the job description. ATS systems rank keyword matches.' },
  { icon: '📊', title: 'Quantify Everything', body: 'Replace "managed marketing campaigns" with "managed $2.4M campaign budget, driving 340% ROI across 12 channels."' },
  { icon: '⚡', title: 'Lead with Impact', body: 'Start each bullet with a strong verb and end with a measurable result. Remove responsibilities — show achievements.' },
  { icon: '🤖', title: 'ATS-Friendly Format', body: 'Use standard section headers, avoid tables/columns, and save as PDF. Most ATS systems parse single-column layouts best.' },
]

export default function ResumeView() {
  const [versions, setVersions] = useState([
    { id: 1, name: 'Sonny_Gonzalez_VP_Marketing_v3.pdf', url: '', date: '2026-03-28', sentTo: ['Twilio', 'Figma', 'Stripe'] },
    { id: 2, name: 'Sonny_Gonzalez_VP_Marketing_v2.pdf', url: '', date: '2026-03-15', sentTo: ['Chime', 'Notion'] },
  ])
  const [activeVersion, setActiveVersion] = useState(0)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newVersion, setNewVersion] = useState({ name: '', url: '' })

  const addVersion = () => {
    if (!newVersion.name.trim()) return
    setVersions(prev => [{
      id: prev.length + 1,
      name: newVersion.name,
      url: newVersion.url,
      date: new Date().toISOString().split('T')[0],
      sentTo: [],
    }, ...prev])
    setNewVersion({ name: '', url: '' })
    setShowAddForm(false)
    setActiveVersion(0)
  }

  const current = versions[activeVersion]

  return (
    <div className="resume-view">
      <div className="rv-header">
        <div>
          <h2>Resume</h2>
          <p className="rv-subtitle">Manage resume versions and track which companies received each version.</p>
        </div>
        <button className="rv-add-btn" onClick={() => setShowAddForm(!showAddForm)}>+ New Version</button>
      </div>

      {showAddForm && (
        <div className="rv-add-form">
          <input className="rv-input" placeholder="Resume filename (e.g. Resume_VP_Marketing_v4.pdf)" value={newVersion.name} onChange={e => setNewVersion({ ...newVersion, name: e.target.value })} />
          <div className="rv-add-row">
            <input className="rv-input" placeholder="Link to file (Google Drive, Dropbox, etc.)" value={newVersion.url} onChange={e => setNewVersion({ ...newVersion, url: e.target.value })} />
            <button className="rv-save-btn" onClick={addVersion}>Add Version</button>
          </div>
        </div>
      )}

      <div className="rv-layout">
        {/* Left: Version list */}
        <div className="rv-versions">
          <div className="rv-versions-label">Versions</div>
          {versions.map((v, i) => (
            <div key={v.id} className={`rv-version-card ${activeVersion === i ? 'active' : ''}`} onClick={() => setActiveVersion(i)}>
              <div className="rv-v-icon">📄</div>
              <div className="rv-v-info">
                <div className="rv-v-name">{v.name}</div>
                <div className="rv-v-date">{v.date}</div>
              </div>
              {v.sentTo.length > 0 && <span className="rv-v-badge">{v.sentTo.length} sent</span>}
            </div>
          ))}
        </div>

        {/* Right: Detail */}
        <div className="rv-detail">
          {current ? (
            <>
              <div className="rv-preview">
                <div className="rv-preview-placeholder">
                  <div className="rv-preview-icon">📄</div>
                  <h3>{current.name}</h3>
                  <p className="rv-preview-date">Added {current.date}</p>
                  {current.url ? (
                    <a href={current.url} target="_blank" rel="noopener noreferrer" className="rv-preview-link">Open Resume ↗</a>
                  ) : (
                    <p className="rv-preview-hint">Add a URL to your resume file (Google Drive, Dropbox, etc.) to enable quick access.</p>
                  )}
                </div>
              </div>

              {current.sentTo.length > 0 && (
                <div className="rv-sent-section">
                  <h4>Sent To</h4>
                  <div className="rv-sent-list">
                    {current.sentTo.map((company, i) => (
                      <span key={i} className="rv-sent-chip">{company}</span>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="rv-empty">No resume versions yet. Add one to get started.</div>
          )}

          {/* Tips */}
          <div className="rv-tips">
            <h4>Resume Tips</h4>
            <div className="rv-tips-grid">
              {RESUME_TIPS.map((tip, i) => (
                <div key={i} className="rv-tip-card">
                  <div className="rv-tip-icon">{tip.icon}</div>
                  <div>
                    <div className="rv-tip-title">{tip.title}</div>
                    <div className="rv-tip-body">{tip.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
