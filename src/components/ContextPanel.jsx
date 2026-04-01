import { useState, useEffect } from 'react'
import './ContextPanel.css'

const FALLBACK_INSIGHTS = [
  { icon: '💡', title: "Today's Tip", body: 'Focus on following up with your most recent applications. Personalized follow-ups within 5 business days increase response rates.' },
  { icon: '📊', title: 'Pattern', body: 'Roles with "Director" or "VP" in the title tend to score higher for your profile. Lean into these keywords.' },
]

const FALLBACK_QUESTIONS = [
  { text: 'Describe a time you launched a product in a competitive market. What was your GTM strategy?', tag: 'Behavioral — GTM' },
  { text: 'How do you measure the ROI of a brand campaign vs. performance marketing?', tag: 'Strategic — Measurement' },
]

const FALLBACK_LINKS = [
  { icon: '📄', title: 'Resume', sub: 'Upload your resume' },
  { icon: '🌐', title: 'Portfolio', sub: 'Add your portfolio URL' },
  { icon: '💼', title: 'LinkedIn', sub: 'Add your LinkedIn' },
  { icon: '🐙', title: 'GitHub', sub: 'Add your GitHub' },
]

export default function ContextPanel({ activity }) {
  const [insights, setInsights] = useState(FALLBACK_INSIGHTS)
  const [questions, setQuestions] = useState(FALLBACK_QUESTIONS)
  const [links, setLinks] = useState(FALLBACK_LINKS)

  useEffect(() => {
    fetch('/api/insights').then(r => r.json()).then(d => d.length && setInsights(d)).catch(() => {})
    fetch('/api/interview-prep').then(r => r.json()).then(d => d.length && setQuestions(d)).catch(() => {})
    fetch('/api/profile/links').then(r => r.json()).then(d => d.length && setLinks(d)).catch(() => {})
  }, [])

  return (
    <div className="context-panel">
      <div className="cp-section">
        <div className="cp-label"><span className="cp-dot" style={{ background: '#D4A017' }} /> AI Insights</div>
        {insights.map((ins, i) => (
          <div key={i} className="insight-card">
            <div className="insight-title"><span>{ins.icon}</span> {ins.title}</div>
            <div className="insight-body">{ins.body}</div>
          </div>
        ))}
      </div>
      <div className="cp-section">
        <div className="cp-label"><span className="cp-dot" style={{ background: '#a78bfa' }} /> Interview Prep</div>
        {questions.map((q, i) => (
          <div key={i} className="prep-q">
            <div className="prep-q-text">"{q.text}"</div>
            <span className="prep-q-tag">{q.tag}</span>
          </div>
        ))}
      </div>
      <div className="cp-section">
        <div className="cp-label"><span className="cp-dot" style={{ background: '#f97316' }} /> Quick Access</div>
        {links.map((lnk, i) => (
          <div key={i} className="qlink">
            <div className="qlink-icon">{lnk.icon}</div>
            <div>
              <div className="qlink-text">{lnk.title}</div>
              <div className="qlink-sub">{lnk.sub}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="cp-section">
        <div className="cp-label"><span className="cp-dot" style={{ background: '#22d3ee' }} /> Activity</div>
        {(activity || []).slice(0, 5).map((a, i) => (
          <div key={i} className="act-item">
            <span className={`act-dot ${a.type}`} />
            <span className="act-msg">{a.message}</span>
            <span className="act-time">{new Date(a.created_at + 'Z').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
