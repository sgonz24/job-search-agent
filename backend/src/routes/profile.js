const express = require('express');
const router = express.Router();
const { db } = require('../db');

const DEFAULT_LINKS = [
  { icon: '📄', title: 'Resume', sub: 'Sonny_Gonzalez_VP_Marketing.pdf', url: '' },
  { icon: '🌐', title: 'Portfolio', sub: 'aiforroi.co', url: 'https://aiforroi.co' },
  { icon: '💼', title: 'LinkedIn', sub: 'linkedin.com/in/sonnygonzalez', url: 'https://linkedin.com/in/sonnygonzalez' },
  { icon: '🐙', title: 'GitHub', sub: 'github.com/sgonz24', url: 'https://github.com/sgonz24' },
];

// Seed defaults if table is empty
function seedDefaults() {
  const count = db.prepare('SELECT COUNT(*) as c FROM profile_links').get().c;
  if (count === 0) {
    const insert = db.prepare('INSERT INTO profile_links (icon, title, sub, url, sort_order) VALUES (?, ?, ?, ?, ?)');
    const tx = db.transaction(() => {
      DEFAULT_LINKS.forEach((l, i) => insert.run(l.icon, l.title, l.sub, l.url, i));
    });
    tx();
  }
}
seedDefaults();

router.get('/', (req, res) => {
  const links = db.prepare('SELECT icon, title, sub, url FROM profile_links ORDER BY sort_order').all();
  res.json(links);
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

  const tx = db.transaction(() => {
    db.prepare('DELETE FROM profile_links').run();
    const insert = db.prepare('INSERT INTO profile_links (icon, title, sub, url, sort_order) VALUES (?, ?, ?, ?, ?)');
    req.body.forEach((l, i) => {
      insert.run(
        String(l.icon || '🔗').slice(0, 4),
        String(l.title || '').slice(0, 100),
        String(l.sub || '').slice(0, 200),
        String(l.url || '').slice(0, 500),
        i
      );
    });
  });
  tx();

  const links = db.prepare('SELECT icon, title, sub, url FROM profile_links ORDER BY sort_order').all();
  res.json(links);
});

module.exports = router;
