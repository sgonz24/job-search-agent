// AI-powered job fit scorer - ranks jobs against Sonny's profile
const PROFILE = require('./resume-profile');

// ── Keyword-based scoring ───────────────────────────────────────────

function scoreJobFit(job) {
  let score = 0;
  const text = `${job.title} ${job.company} ${job.location} ${job.description || ''}`.toLowerCase();

  // Title match (0-40 points)
  const titleLower = job.title.toLowerCase();
  if (titleLower.includes('vp') || titleLower.includes('vice president')) score += 30;
  else if (titleLower.includes('cmo') || titleLower.includes('chief marketing')) score += 35;
  else if (titleLower.includes('svp') || titleLower.includes('senior vice president')) score += 35;
  else if (titleLower.includes('head of marketing')) score += 28;
  else if (titleLower.includes('director')) score += 15;

  if (titleLower.includes('marketing')) score += 10;
  if (titleLower.includes('growth')) score += 8;
  if (titleLower.includes('demand gen')) score += 8;
  if (titleLower.includes('digital')) score += 5;

  // Remote match (0-15 points)
  if (text.includes('remote') || text.includes('anywhere') || text.includes('distributed')) score += 15;
  if (text.includes('hybrid') && !text.includes('remote')) score -= 5;
  if (text.includes('on-site') || text.includes('onsite') || text.includes('in-office')) score -= 20;

  // AI/Tech differentiator bonus (0-20 points)
  if (text.includes('ai') || text.includes('artificial intelligence')) score += 15;
  if (text.includes('automation')) score += 10;
  if (text.includes('machine learning') || text.includes('ml')) score += 8;
  if (text.includes('martech') || text.includes('marketing technology')) score += 8;
  if (text.includes('data-driven') || text.includes('analytics')) score += 5;

  // Industry match (0-10 points)
  const industryMatches = PROFILE.targetIndustries.filter(ind =>
    text.includes(ind.toLowerCase())
  );
  score += Math.min(industryMatches.length * 3, 10);

  // Skills keyword match (0-15 points)
  const keywordMatches = PROFILE.highValueKeywords.filter(kw => text.includes(kw));
  score += Math.min(keywordMatches.length * 2, 15);

  // B2B/B2C match
  if (text.includes('b2b')) score += 5;
  if (text.includes('b2c')) score += 3;
  if (text.includes('b2b') && text.includes('b2c')) score += 5;

  // GTM experience
  if (text.includes('gtm') || text.includes('go-to-market')) score += 8;

  // P&L / budget management
  if (text.includes('p&l') || text.includes('budget')) score += 5;

  // Team leadership
  if (text.includes('team') || text.includes('leadership') || text.includes('manage')) score += 3;

  // Salary indicators (bonus if listed and competitive)
  if (job.salary) {
    score += 5;
    const match = job.salary.match(/\$(\d+)/);
    if (match && parseInt(match[1]) >= 150000) score += 5;
    if (match && parseInt(match[1]) >= 200000) score += 5;
  }

  // Negative signals
  if (text.includes('intern') || text.includes('entry level') || text.includes('junior')) score -= 30;
  if (text.includes('coordinator') || text.includes('specialist') || text.includes('analyst')) score -= 20;
  if (text.includes('assistant') || text.includes('associate')) score -= 25;

  return {
    ...job,
    fitScore: Math.max(0, Math.min(100, score)),
    matchReasons: getMatchReasons(job, text),
    tier: score >= 70 ? 'A' : score >= 50 ? 'B' : score >= 30 ? 'C' : 'D',
  };
}

function getMatchReasons(job, text) {
  const reasons = [];
  const titleLower = job.title.toLowerCase();

  if (titleLower.includes('vp') || titleLower.includes('vice president') || titleLower.includes('cmo'))
    reasons.push('Executive-level title match');
  if (text.includes('remote')) reasons.push('Remote position');
  if (text.includes('ai') || text.includes('automation'))
    reasons.push('AI/Automation focus — your top differentiator');
  if (text.includes('b2b') || text.includes('b2c'))
    reasons.push('B2B/B2C experience match');
  if (text.includes('gtm') || text.includes('go-to-market'))
    reasons.push('GTM experience required — direct match');
  if (text.includes('saas') || text.includes('tech'))
    reasons.push('Tech/SaaS industry');
  if (text.includes('growth'))
    reasons.push('Growth-focused role');

  return reasons;
}

// ── Rank and filter ─────────────────────────────────────────────────

function rankJobs(jobs, minTier = 'C') {
  const tierOrder = { A: 0, B: 1, C: 2, D: 3 };
  const maxTier = tierOrder[minTier] || 2;

  return jobs
    .map(scoreJobFit)
    .filter(job => tierOrder[job.tier] <= maxTier)
    .sort((a, b) => b.fitScore - a.fitScore);
}

module.exports = { scoreJobFit, rankJobs };
