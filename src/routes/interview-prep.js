const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json([
    { text: 'Describe a time you launched a product in a competitive market. What was your GTM strategy?', tag: 'Behavioral — GTM' },
    { text: 'How do you measure the ROI of a brand campaign vs. performance marketing?', tag: 'Strategic — Measurement' },
    { text: 'Tell me about a cross-functional initiative you led that drove measurable revenue impact.', tag: 'Behavioral — Leadership' },
  ]);
});

module.exports = router;
