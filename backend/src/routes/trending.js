const express = require('express');
const router = express.Router();

const MOCK_TWEETS = [
  { id: 1, name: 'Anthropic', handle: '@AnthropicAI', avatar: '#1d9bf0', time: '2h', body: '<b>Claude Code</b> now supports autonomous multi-file editing with tool use.', tags: [{ label: 'AI', color: 'ai' }, { label: 'Claude', color: 'claude' }], likes: '4.8K', retweets: '1.2K', comments: '342' },
  { id: 2, name: 'Lenny Rachitsky', handle: '@lennysan', avatar: '#666', time: '5h', body: 'The best <b>VP of Marketing</b> hires all had one thing in common: they could tie every campaign back to revenue within 48 hours.', tags: [{ label: 'Career', color: 'career' }], likes: '2.1K', retweets: '410', comments: '89' },
  { id: 3, name: 'Devin AI', handle: '@cognition', avatar: '#7c3aed', time: '8h', body: 'Marketing teams using <b>AI agents</b> for competitive analysis are shipping campaigns 3x faster.', tags: [{ label: 'AI', color: 'ai' }, { label: 'MarTech', color: 'tech' }], likes: '890', retweets: '203', comments: '56' },
];

const MOCK_NEWS = [
  { id: 1, source: 'TechCrunch', title: 'AI-powered job platforms see 300% surge in VP-level placements', time: '45 min ago', readTime: '3 min' },
  { id: 2, source: 'The Verge', title: 'Claude 4.5 benchmarks show major gains in code generation', time: '2h ago', readTime: '5 min' },
];

router.get('/', (req, res) => {
  res.json({ tweets: MOCK_TWEETS, news: MOCK_NEWS });
});

module.exports = router;
