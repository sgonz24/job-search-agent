import { useState, useEffect, useRef } from 'react'
import './InterviewPrepView.css'

const QUESTION_BANK = [
  { id: 1, text: 'Describe a time you launched a product in a competitive market. What was your GTM strategy?', category: 'Behavioral', tag: 'GTM', tip: 'Use the STAR method. Focus on: market analysis you did, channels chosen, metrics you tracked, and the quantified outcome.' },
  { id: 2, text: 'How do you measure the ROI of a brand campaign vs. performance marketing?', category: 'Strategic', tag: 'Measurement', tip: 'Mention attribution models, brand lift studies, incrementality testing. Show you understand both short-term ROAS and long-term brand equity.' },
  { id: 3, text: 'Tell me about a cross-functional initiative you led that drove measurable revenue impact.', category: 'Behavioral', tag: 'Leadership', tip: 'Highlight stakeholder alignment, how you handled resistance, the framework you used to track progress, and the revenue number.' },
  { id: 4, text: 'How would you build a marketing team from scratch for a Series B startup?', category: 'Strategic', tag: 'Team Building', tip: 'Discuss hiring priorities (generalist first vs. specialist), budget allocation, agency vs. in-house decisions, and 90-day milestones.' },
  { id: 5, text: 'Walk me through how you would evaluate and prioritize marketing channels for a new product launch.', category: 'Strategic', tag: 'Channel Strategy', tip: 'Framework: audience research → channel mapping → small-budget tests → double down on winners. Mention CAC, LTV, and payback period.' },
  { id: 6, text: 'Tell me about a campaign that failed. What did you learn?', category: 'Behavioral', tag: 'Failure', tip: 'Be honest and specific. Show self-awareness, what you changed, and how the next campaign improved as a result.' },
  { id: 7, text: 'How do you stay current with marketing trends and emerging platforms?', category: 'Situational', tag: 'Growth Mindset', tip: 'Name specific sources (newsletters, communities, tools). Mention a recent trend you adopted and the result.' },
  { id: 8, text: 'Describe your experience with marketing automation and AI tools.', category: 'Technical', tag: 'MarTech', tip: 'Be specific about tools (HubSpot, Marketo, etc.), integrations you built, and efficiency gains. Mention AI use cases you have explored.' },
  { id: 9, text: 'How do you align sales and marketing teams around shared goals?', category: 'Situational', tag: 'Sales Alignment', tip: 'Discuss SLAs, shared dashboards, regular syncs, lead scoring criteria, and how you handle disagreements on MQL definitions.' },
  { id: 10, text: 'What is your approach to content strategy for a B2B SaaS company?', category: 'Strategic', tag: 'Content', tip: 'Cover: audience personas, funnel mapping, SEO vs. thought leadership balance, distribution channels, and how you measure content ROI.' },
  { id: 11, text: 'How would you handle a PR crisis for a tech company?', category: 'Situational', tag: 'Crisis Management', tip: 'Show a framework: assess severity, internal alignment, external comms timeline, channel strategy, and post-mortem process.' },
  { id: 12, text: 'Explain how you would use data to inform creative decisions.', category: 'Technical', tag: 'Data-Driven', tip: 'Mention A/B testing, creative performance analytics, audience insights, and how you balance data with brand intuition.' },
]

const CATEGORIES = ['All', 'Behavioral', 'Strategic', 'Technical', 'Situational']

export default function InterviewPrepView() {
  const [questions, setQuestions] = useState(QUESTION_BANK)
  const [category, setCategory] = useState('All')
  const [expandedId, setExpandedId] = useState(null)
  const [practiceMode, setPracticeMode] = useState(false)
  const [practiceQ, setPracticeQ] = useState(null)
  const [timer, setTimer] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newQ, setNewQ] = useState({ text: '', category: 'Behavioral', tag: '', tip: '' })
  const timerRef = useRef(null)

  useEffect(() => {
    fetch('/api/interview-prep')
      .then(r => r.json())
      .then(data => {
        if (data.length) {
          const merged = [...QUESTION_BANK]
          data.forEach(q => {
            if (!merged.find(m => m.text === q.text)) {
              merged.push({ ...q, id: merged.length + 1, category: q.tag?.split(' — ')[0] || 'Behavioral', tag: q.tag?.split(' — ')[1] || q.tag || '' })
            }
          })
          setQuestions(merged)
        }
      })
      .catch(() => {})
  }, [])

  const filtered = category === 'All' ? questions : questions.filter(q => q.category === category)

  const startPractice = () => {
    const pool = filtered.length > 0 ? filtered : questions
    const random = pool[Math.floor(Math.random() * pool.length)]
    setPracticeQ(random)
    setPracticeMode(true)
    setTimer(0)
    setTimerRunning(true)
  }

  const nextQuestion = () => {
    const pool = filtered.length > 0 ? filtered : questions
    const random = pool[Math.floor(Math.random() * pool.length)]
    setPracticeQ(random)
    setTimer(0)
    setTimerRunning(true)
  }

  const stopPractice = () => {
    setPracticeMode(false)
    setTimerRunning(false)
    setTimer(0)
  }

  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [timerRunning])

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  const addQuestion = () => {
    if (!newQ.text.trim()) return
    setQuestions(prev => [...prev, { ...newQ, id: prev.length + 1, tip: newQ.tip || 'Practice your answer using the STAR method.' }])
    setNewQ({ text: '', category: 'Behavioral', tag: '', tip: '' })
    setShowAddForm(false)
  }

  if (practiceMode && practiceQ) {
    return (
      <div className="prep-view">
        <div className="practice-mode">
          <div className="practice-header">
            <span className="practice-label">Practice Mode</span>
            <span className="practice-timer">{formatTime(timer)}</span>
            <button className="practice-stop" onClick={stopPractice}>Exit Practice</button>
          </div>
          <div className="practice-card">
            <span className="practice-cat">{practiceQ.category} — {practiceQ.tag}</span>
            <h2 className="practice-question">{practiceQ.text}</h2>
            <div className="practice-tip">
              <h4>Coaching Tip</h4>
              <p>{practiceQ.tip}</p>
            </div>
          </div>
          <div className="practice-actions">
            <button className="practice-next" onClick={nextQuestion}>Next Question →</button>
            <button className="practice-pause" onClick={() => setTimerRunning(!timerRunning)}>
              {timerRunning ? 'Pause Timer' : 'Resume Timer'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="prep-view">
      <div className="pv-header">
        <div>
          <h2>Interview Prep</h2>
          <p className="pv-subtitle">{questions.length} questions across {CATEGORIES.length - 1} categories. Click any question to see coaching tips.</p>
        </div>
        <div className="pv-actions">
          <button className="pv-add-btn" onClick={() => setShowAddForm(!showAddForm)}>+ Add Question</button>
          <button className="pv-practice-btn" onClick={startPractice}>Practice Mode</button>
        </div>
      </div>

      {showAddForm && (
        <div className="pv-add-form">
          <input className="pv-input" placeholder="Your interview question..." value={newQ.text} onChange={e => setNewQ({ ...newQ, text: e.target.value })} />
          <div className="pv-add-row">
            <select className="pv-select" value={newQ.category} onChange={e => setNewQ({ ...newQ, category: e.target.value })}>
              {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input className="pv-input pv-input-sm" placeholder="Tag (e.g. GTM)" value={newQ.tag} onChange={e => setNewQ({ ...newQ, tag: e.target.value })} />
            <input className="pv-input" placeholder="Coaching tip (optional)" value={newQ.tip} onChange={e => setNewQ({ ...newQ, tip: e.target.value })} />
            <button className="pv-save-q" onClick={addQuestion}>Add</button>
          </div>
        </div>
      )}

      <div className="pv-tabs">
        {CATEGORIES.map(c => (
          <button key={c} className={`pv-tab ${category === c ? 'active' : ''}`} onClick={() => setCategory(c)}>
            {c}
            {c !== 'All' && <span className="pv-tab-count">{questions.filter(q => q.category === c).length}</span>}
          </button>
        ))}
      </div>

      <div className="pv-list">
        {filtered.map(q => (
          <div key={q.id} className={`pv-question ${expandedId === q.id ? 'expanded' : ''}`} onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}>
            <div className="pv-q-header">
              <div className="pv-q-meta">
                <span className={`pv-q-cat cat-${q.category.toLowerCase()}`}>{q.category}</span>
                <span className="pv-q-tag">{q.tag}</span>
              </div>
              <span className="pv-q-chevron">{expandedId === q.id ? '▾' : '▸'}</span>
            </div>
            <p className="pv-q-text">{q.text}</p>
            {expandedId === q.id && (
              <div className="pv-q-tip">
                <h4>Coaching Tip</h4>
                <p>{q.tip}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
