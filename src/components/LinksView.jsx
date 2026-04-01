import { useState, useEffect } from 'react'
import './LinksView.css'

const DEFAULT_LINKS = [
  { icon: '📄', title: 'Resume', sub: '', url: '', editable: true, removable: false },
  { icon: '🌐', title: 'Portfolio', sub: '', url: '', editable: true, removable: false },
  { icon: '💼', title: 'LinkedIn', sub: '', url: '', editable: true, removable: false },
  { icon: '🐙', title: 'GitHub', sub: '', url: '', editable: true, removable: false },
]

export default function LinksView() {
  const [links, setLinks] = useState(DEFAULT_LINKS)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    fetch('/api/profile/links')
      .then(r => r.json())
      .then(data => {
        if (data.length) setLinks(data.map(l => ({ ...l, editable: true, removable: !['Resume', 'Portfolio', 'LinkedIn', 'GitHub'].includes(l.title) })))
      })
      .catch(() => {})
  }, [])

  const updateLink = (index, field, value) => {
    setLinks(prev => prev.map((l, i) => i === index ? { ...l, [field]: value } : l))
  }

  const addLink = () => {
    setLinks(prev => [...prev, { icon: '🔗', title: '', sub: '', url: '', editable: true, removable: true }])
  }

  const removeLink = (index) => {
    setLinks(prev => prev.filter((_, i) => i !== index))
  }

  const saveLinks = async () => {
    setSaving(true)
    try {
      await fetch('/api/profile/links', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(links.map(({ editable, removable, ...rest }) => rest)),
      })
      setToast('Links saved!')
      setTimeout(() => setToast(''), 2500)
    } catch {
      setToast('Failed to save')
      setTimeout(() => setToast(''), 2500)
    }
    setSaving(false)
  }

  return (
    <div className="links-view">
      <div className="lv-header">
        <div>
          <h2>Links & Portfolio</h2>
          <p className="lv-subtitle">Manage your web presence — these links appear in your Quick Access panel and can be included in applications.</p>
        </div>
        <div className="lv-actions">
          <button className="lv-add-btn" onClick={addLink}>+ Add Link</button>
          <button className="lv-save-btn" onClick={saveLinks} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="lv-grid">
        {links.map((link, i) => (
          <div key={i} className="lv-card">
            <div className="lv-card-header">
              <span className="lv-card-icon">{link.icon}</span>
              <input
                className="lv-card-title-input"
                value={link.title}
                onChange={e => updateLink(i, 'title', e.target.value)}
                placeholder="Link name"
              />
              {link.removable && (
                <button className="lv-card-delete" onClick={() => removeLink(i)} title="Remove">×</button>
              )}
            </div>
            <div className="lv-card-body">
              <label className="lv-field-label">URL</label>
              <div className="lv-url-row">
                <input
                  className="lv-input"
                  value={link.url || ''}
                  onChange={e => updateLink(i, 'url', e.target.value)}
                  placeholder="https://..."
                />
                {link.url && (
                  <a href={link.url} target="_blank" rel="noopener" className="lv-open-btn" title="Open link">↗</a>
                )}
              </div>
              <label className="lv-field-label">Description</label>
              <input
                className="lv-input"
                value={link.sub || ''}
                onChange={e => updateLink(i, 'sub', e.target.value)}
                placeholder="Short description..."
              />
            </div>
          </div>
        ))}
      </div>

      {toast && <div className="lv-toast">{toast}</div>}
    </div>
  )
}
