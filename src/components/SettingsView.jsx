import { useState } from 'react'
import './SettingsView.css'

export default function SettingsView() {
  const [settings, setSettings] = useState({
    scanInterval: '6',
    autoApplyTiers: ['A', 'B'],
    maxAutoApply: '5',
    sources: { linkedin: true, greenhouse: true, lever: true, indeed: false, ziprecruiter: false, builtin: false },
    notifications: { scanComplete: true, applicationSent: true, errors: true },
    targetRole: 'VP of Marketing',
    targetLocation: 'Remote',
    minSalary: '150000',
  })
  const [saved, setSaved] = useState(false)

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const toggleSource = (source) => {
    setSettings(prev => ({ ...prev, sources: { ...prev.sources, [source]: !prev.sources[source] } }))
  }

  const toggleNotif = (key) => {
    setSettings(prev => ({ ...prev, notifications: { ...prev.notifications, [key]: !prev.notifications[key] } }))
  }

  const toggleTier = (tier) => {
    setSettings(prev => ({
      ...prev,
      autoApplyTiers: prev.autoApplyTiers.includes(tier)
        ? prev.autoApplyTiers.filter(t => t !== tier)
        : [...prev.autoApplyTiers, tier]
    }))
  }

  const save = () => {
    localStorage.setItem('jobhq-settings', JSON.stringify(settings))
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="settings-view">
      <div className="sv-header">
        <div>
          <h2>Settings</h2>
          <p className="sv-subtitle">Configure your job search agent preferences.</p>
        </div>
        <button className="sv-save-btn" onClick={save}>{saved ? 'Saved!' : 'Save Settings'}</button>
      </div>

      <div className="sv-sections">
        {/* Search Preferences */}
        <div className="sv-section">
          <h3>Search Preferences</h3>
          <div className="sv-field">
            <label>Target Role</label>
            <input className="sv-input" value={settings.targetRole} onChange={e => updateSetting('targetRole', e.target.value)} />
          </div>
          <div className="sv-field">
            <label>Location</label>
            <input className="sv-input" value={settings.targetLocation} onChange={e => updateSetting('targetLocation', e.target.value)} />
          </div>
          <div className="sv-field">
            <label>Minimum Salary</label>
            <div className="sv-salary-row">
              <span className="sv-salary-prefix">$</span>
              <input className="sv-input" type="number" value={settings.minSalary} onChange={e => updateSetting('minSalary', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Job Sources */}
        <div className="sv-section">
          <h3>Job Sources</h3>
          <p className="sv-section-desc">Enable or disable job board sources for scanning.</p>
          <div className="sv-toggles">
            {Object.entries(settings.sources).map(([source, enabled]) => (
              <div key={source} className="sv-toggle-row" onClick={() => toggleSource(source)}>
                <span className="sv-toggle-label">{source.charAt(0).toUpperCase() + source.slice(1)}</span>
                <div className={`sv-toggle ${enabled ? 'on' : ''}`}>
                  <div className="sv-toggle-knob" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Auto-Apply */}
        <div className="sv-section">
          <h3>Auto-Apply</h3>
          <div className="sv-field">
            <label>Apply to tiers</label>
            <div className="sv-tier-btns">
              {['A', 'B', 'C'].map(t => (
                <button key={t} className={`sv-tier-btn ${settings.autoApplyTiers.includes(t) ? 'active' : ''}`} onClick={() => toggleTier(t)}>
                  Tier {t}
                </button>
              ))}
            </div>
          </div>
          <div className="sv-field">
            <label>Max applications per batch</label>
            <select className="sv-select" value={settings.maxAutoApply} onChange={e => updateSetting('maxAutoApply', e.target.value)}>
              {['1', '3', '5', '10', '15', '25'].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="sv-field">
            <label>Scan interval (hours)</label>
            <select className="sv-select" value={settings.scanInterval} onChange={e => updateSetting('scanInterval', e.target.value)}>
              {['1', '3', '6', '12', '24'].map(n => <option key={n} value={n}>Every {n}h</option>)}
            </select>
          </div>
        </div>

        {/* Notifications */}
        <div className="sv-section">
          <h3>Notifications</h3>
          <div className="sv-toggles">
            {[
              ['scanComplete', 'Scan complete'],
              ['applicationSent', 'Application sent'],
              ['errors', 'Errors & failures'],
            ].map(([key, label]) => (
              <div key={key} className="sv-toggle-row" onClick={() => toggleNotif(key)}>
                <span className="sv-toggle-label">{label}</span>
                <div className={`sv-toggle ${settings.notifications[key] ? 'on' : ''}`}>
                  <div className="sv-toggle-knob" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* About */}
        <div className="sv-section sv-about">
          <h3>About</h3>
          <p>Job Search Agent — built by <a href="https://aiforroi.co" target="_blank" rel="noopener">aiforroi.co</a></p>
          <p className="sv-version">Version 2.0 — JobHQ Redesign</p>
        </div>
      </div>
    </div>
  )
}
