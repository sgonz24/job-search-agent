import { useState, useEffect } from 'react'
import './TrendingPanel.css'

function renderTweetBody(html) {
  const parts = html.split(/(<b>|<\/b>)/g).filter(Boolean)
  let bold = false
  return parts.map((part, i) => {
    if (part === '<b>') { bold = true; return null }
    if (part === '</b>') { bold = false; return null }
    return bold ? <strong key={i}>{part}</strong> : part
  })
}

const MOCK_TWEETS = [
  { id: 1, name: 'Anthropic', handle: '@AnthropicAI', avatar: '#1d9bf0', time: '2h', body: '<b>Claude Code</b> now supports autonomous multi-file editing with tool use.', tags: [{ label: 'AI', color: 'ai' }, { label: 'Claude', color: 'claude' }], likes: '4.8K', retweets: '1.2K', comments: '342' },
  { id: 2, name: 'Lenny Rachitsky', handle: '@lennysan', avatar: '#666', time: '5h', body: 'The best <b>VP of Marketing</b> hires all had one thing in common: they could tie every campaign back to revenue within 48 hours.', tags: [{ label: 'Career', color: 'career' }], likes: '2.1K', retweets: '410', comments: '89' },
  { id: 3, name: 'Devin AI', handle: '@cognition', avatar: '#7c3aed', time: '8h', body: 'Marketing teams using <b>AI agents</b> for competitive analysis are shipping campaigns 3x faster.', tags: [{ label: 'AI', color: 'ai' }, { label: 'MarTech', color: 'tech' }], likes: '890', retweets: '203', comments: '56' },
]

const MOCK_NEWS = [
  { id: 1, source: 'TechCrunch', title: 'AI-powered job platforms see 300% surge in VP-level placements', time: '45 min ago', readTime: '3 min' },
  { id: 2, source: 'The Verge', title: 'Claude 4.5 benchmarks show major gains in code generation', time: '2h ago', readTime: '5 min' },
]

export default function TrendingPanel({ collapsed, onToggleCollapse }) {
  const [tab, setTab] = useState('x')
  const [trending, setTrending] = useState(null)

  useEffect(() => {
    fetch('/api/trending')
      .then(r => r.json())
      .then(setTrending)
      .catch(() => setTrending({ tweets: MOCK_TWEETS, news: MOCK_NEWS }))
  }, [])

  const data = trending || { tweets: MOCK_TWEETS, news: MOCK_NEWS }

  if (collapsed) return null

  return (
    <div className="trending-panel">
      <div className="tp-header">
        <div className="tp-title">
          <div className="tp-live" />
          Trending
        </div>
        <button className="tp-collapse" onClick={onToggleCollapse} title="Collapse">‹</button>
      </div>
      <div className="tp-tabs">
        <button className={`tp-tab ${tab === 'x' ? 'active' : ''}`} onClick={() => setTab('x')}>𝕏 / AI</button>
        <button className={`tp-tab ${tab === 'news' ? 'active' : ''}`} onClick={() => setTab('news')}>News</button>
        <button className={`tp-tab ${tab === 'hn' ? 'active' : ''}`} onClick={() => setTab('hn')}>HN</button>
      </div>
      <div className="tp-feed">
        {tab === 'x' && data.tweets.map(t => (
          <div key={t.id} className="tweet">
            <div className="tweet-header">
              <div className="tweet-avatar" style={{ background: t.avatar }} />
              <div>
                <div className="tweet-name">{t.name}</div>
                <div className="tweet-handle">{t.handle}</div>
              </div>
              <span className="tweet-time">{t.time}</span>
            </div>
            <div className="tweet-body">{renderTweetBody(t.body)}</div>
            <div className="tweet-tags">
              {t.tags.map((tag, i) => <span key={i} className={`tweet-tag ${tag.color}`}>{tag.label}</span>)}
            </div>
            <div className="tweet-engagement">
              <span>💬 {t.comments}</span>
              <span>🔄 {t.retweets}</span>
              <span>❤️ {t.likes}</span>
            </div>
          </div>
        ))}
        {tab === 'news' && data.news.map(n => (
          <div key={n.id} className="news-item">
            <div className="news-source">{n.source}</div>
            <div className="news-title">{n.title}</div>
            <div className="news-meta">{n.time} · {n.readTime} read</div>
          </div>
        ))}
        {tab === 'hn' && <div className="tp-placeholder">HN feed coming soon</div>}
      </div>
    </div>
  )
}
