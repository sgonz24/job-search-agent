const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json([
    { icon: '💡', title: "Today's Tip", body: 'Focus on following up with your most recent applications. Personalized follow-ups within 5 business days increase response rates.' },
    { icon: '📊', title: 'Pattern', body: 'Roles with "Director" or "VP" in the title tend to score higher for your profile. Lean into these keywords.' },
  ]);
});

module.exports = router;
