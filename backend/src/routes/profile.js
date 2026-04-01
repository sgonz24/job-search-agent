const express = require('express');
const router = express.Router();

let userLinks = [
  { icon: '📄', title: 'Resume', sub: 'Sonny_Gonzalez_VP_Marketing.pdf', url: '' },
  { icon: '🌐', title: 'Portfolio', sub: 'aiforroi.co', url: 'https://aiforroi.co' },
  { icon: '💼', title: 'LinkedIn', sub: 'linkedin.com/in/sonnygonzalez', url: 'https://linkedin.com/in/sonnygonzalez' },
  { icon: '🐙', title: 'GitHub', sub: 'github.com/sgonz24', url: 'https://github.com/sgonz24' },
];

router.get('/', (req, res) => {
  res.json(userLinks);
});

router.put('/', (req, res) => {
  if (!Array.isArray(req.body) || req.body.length > 20) {
    return res.status(400).json({ error: 'Invalid links data' });
  }
  for (const link of req.body) {
    if (typeof link.title !== 'string' || link.title.length > 100) {
      return res.status(400).json({ error: 'Invalid link title' });
    }
    if (link.url && typeof link.url === 'string' && !link.url.match(/^https?:\/\//i) && link.url.length > 0) {
      return res.status(400).json({ error: 'URLs must start with http:// or https://' });
    }
  }
  userLinks = req.body.map(l => ({
    icon: String(l.icon || '🔗').slice(0, 4),
    title: String(l.title || '').slice(0, 100),
    sub: String(l.sub || '').slice(0, 200),
    url: String(l.url || '').slice(0, 500),
  }));
  res.json(userLinks);
});

module.exports = router;
