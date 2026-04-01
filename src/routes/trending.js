const express = require('express');
const router = express.Router();

const MOCK_TWEETS = [
  { id: 1, name: 'Anthropic', handle: '@AnthropicAI', avatar: '#1d9bf0', time: '2h', url: 'https://x.com/AnthropicAI', body: '<b>Claude Code</b> now supports autonomous multi-file editing with tool use.', tags: [{ label: 'AI', color: 'ai' }, { label: 'Claude', color: 'claude' }], likes: '4.8K', retweets: '1.2K', comments: '342' },
  { id: 2, name: 'Lenny Rachitsky', handle: '@lennysan', avatar: '#666', time: '5h', url: 'https://x.com/lennysan', body: 'The best <b>VP of Marketing</b> hires all had one thing in common: they could tie every campaign back to revenue within 48 hours.', tags: [{ label: 'Career', color: 'career' }], likes: '2.1K', retweets: '410', comments: '89' },
  { id: 3, name: 'Devin AI', handle: '@cognition', avatar: '#7c3aed', time: '8h', url: 'https://x.com/cognabordev', body: 'Marketing teams using <b>AI agents</b> for competitive analysis are shipping campaigns 3x faster.', tags: [{ label: 'AI', color: 'ai' }, { label: 'MarTech', color: 'tech' }], likes: '890', retweets: '203', comments: '56' },
  { id: 4, name: 'Rand Fishkin', handle: '@randfish', avatar: '#f59e0b', time: '3h', url: 'https://x.com/randfish', body: 'Unpopular opinion: the best <b>marketing leaders</b> in 2026 aren\'t just data-driven — they\'re <b>AI-fluent</b>. If you can\'t build an agent workflow, you\'re already behind.', tags: [{ label: 'Marketing', color: 'career' }, { label: 'AI', color: 'ai' }], likes: '3.4K', retweets: '820', comments: '215' },
  { id: 5, name: 'Sam Altman', handle: '@sama', avatar: '#10b981', time: '6h', url: 'https://x.com/sama', body: 'The companies hiring <b>growth marketers</b> who understand AI pipelines are outperforming peers by 4x on CAC efficiency.', tags: [{ label: 'AI', color: 'ai' }, { label: 'Growth', color: 'tech' }], likes: '12.1K', retweets: '3.2K', comments: '890' },
  { id: 6, name: 'Elena Verna', handle: '@elenaverna', avatar: '#ec4899', time: '1h', url: 'https://x.com/elenaverna', body: 'Stop hiring <b>VP Marketing</b> who only know paid channels. The future is <b>product-led growth + AI automation</b>. The best candidates build systems, not just campaigns.', tags: [{ label: 'PLG', color: 'tech' }, { label: 'Career', color: 'career' }], likes: '5.6K', retweets: '1.5K', comments: '378' },
  { id: 7, name: 'Dario Amodei', handle: '@DarioAmodei', avatar: '#6366f1', time: '4h', url: 'https://x.com/DarioAmodei', body: 'We\'re seeing unprecedented demand for <b>marketing + AI hybrid roles</b>. The intersection of brand storytelling and technical fluency is the new competitive moat.', tags: [{ label: 'AI', color: 'ai' }, { label: 'Hiring', color: 'career' }], likes: '8.3K', retweets: '2.1K', comments: '445' },
  { id: 8, name: 'Brian Balfour', handle: '@bbalfour', avatar: '#f97316', time: '12h', url: 'https://x.com/bbalfour', body: 'Hot take: <b>Head of Growth</b> roles at Series B-D companies are the best path to VP Marketing. You get exposure to full-funnel, real budget, and board-level reporting.', tags: [{ label: 'Career', color: 'career' }, { label: 'Growth', color: 'tech' }], likes: '1.9K', retweets: '340', comments: '127' },
];

const MOCK_NEWS = [
  { id: 1, source: 'TechCrunch', title: 'AI-powered job platforms see 300% surge in VP-level placements', time: '45 min ago', readTime: '3 min', url: 'https://techcrunch.com/category/artificial-intelligence/' },
  { id: 2, source: 'The Verge', title: 'Claude 4.5 benchmarks show major gains in code generation', time: '2h ago', readTime: '5 min', url: 'https://www.theverge.com/ai-artificial-intelligence' },
  { id: 3, source: 'Forbes', title: 'Why CMOs Are Becoming Chief AI Officers', time: '1h ago', readTime: '4 min', url: 'https://www.forbes.com/ai/' },
  { id: 4, source: 'Marketing Brew', title: 'The VP Marketing role is evolving — here\'s what boards want in 2026', time: '3h ago', readTime: '6 min', url: 'https://www.marketingbrew.com/' },
  { id: 5, source: 'Wall Street Journal', title: 'Tech layoffs slow as companies ramp AI-focused marketing hires', time: '5h ago', readTime: '4 min', url: 'https://www.wsj.com/tech' },
  { id: 6, source: 'Hacker News', title: 'Show HN: AI agent that auto-applies to jobs via Greenhouse and Lever APIs', time: '30 min ago', readTime: '2 min', url: 'https://news.ycombinator.com/' },
  { id: 7, source: 'AdWeek', title: 'Brands doubling down on performance marketing execs who understand attribution', time: '4h ago', readTime: '3 min', url: 'https://www.adweek.com/' },
];

router.get('/', (req, res) => {
  res.json({ tweets: MOCK_TWEETS, news: MOCK_NEWS });
});

module.exports = router;
