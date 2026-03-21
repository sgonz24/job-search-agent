require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const path = require('path');
const { db, stmts } = require('./db');
const { runFullSearch } = require('./search-engine');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ───────────────────────────────────────────────────────

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use(express.json());

// ── API Routes ──────────────────────────────────────────────────────

// Dashboard stats
app.get('/api/stats', (req, res) => {
  const stats = stmts.getStats.get();
  const recentRuns = stmts.getSearchRuns.all(5);
  const lastRun = recentRuns[0] || null;
  res.json({ stats, lastRun, recentRuns });
});

// All jobs (with optional filters)
app.get('/api/jobs', (req, res) => {
  const { tier, status, search, limit = 100, offset = 0 } = req.query;

  let jobs;
  if (search) {
    const q = `%${search}%`;
    jobs = stmts.searchJobs.all(q, q);
  } else if (tier) {
    jobs = stmts.getJobsByTier.all(tier);
  } else if (status) {
    jobs = stmts.getJobsByStatus.all(status);
  } else {
    jobs = stmts.getAllJobs.all();
  }

  // Parse JSON fields
  jobs = jobs.map(j => ({
    ...j,
    match_reasons: safeParseJSON(j.match_reasons, []),
  }));

  // Paginate
  const total = jobs.length;
  jobs = jobs.slice(Number(offset), Number(offset) + Number(limit));

  res.json({ jobs, total });
});

// Single job detail
app.get('/api/jobs/:id', (req, res) => {
  const job = stmts.getJobById.get(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  job.match_reasons = safeParseJSON(job.match_reasons, []);
  res.json(job);
});

// Update job status
app.patch('/api/jobs/:id/status', (req, res) => {
  const { status } = req.body;
  const validStatuses = ['new', 'saved', 'applied', 'interviewing', 'rejected', 'offer', 'hidden'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  if (status === 'applied') {
    stmts.markApplied.run(req.params.id);
  } else {
    stmts.updateJobStatus.run(status, req.params.id);
  }
  stmts.logActivity.run('status', `Job #${req.params.id} → ${status}`, req.params.id);

  const job = stmts.getJobById.get(req.params.id);
  res.json(job);
});

// Update job notes
app.patch('/api/jobs/:id/notes', (req, res) => {
  const { notes } = req.body;
  stmts.updateJobNotes.run(notes, req.params.id);
  const job = stmts.getJobById.get(req.params.id);
  res.json(job);
});

// Trigger manual search
let searchInProgress = false;
app.post('/api/search', async (req, res) => {
  if (searchInProgress) {
    return res.status(409).json({ error: 'Search already in progress' });
  }
  searchInProgress = true;
  res.json({ message: 'Search started', status: 'running' });

  try {
    const result = await runFullSearch();
    console.log('[server] Manual search completed:', result);
  } catch (err) {
    console.error('[server] Manual search failed:', err.message);
  } finally {
    searchInProgress = false;
  }
});

// Search status
app.get('/api/search/status', (req, res) => {
  const runs = stmts.getSearchRuns.all(1);
  res.json({
    inProgress: searchInProgress,
    lastRun: runs[0] || null,
  });
});

// Activity log
app.get('/api/activity', (req, res) => {
  const limit = Number(req.query.limit) || 50;
  const log = stmts.getActivityLog.all(limit);
  res.json(log);
});

// Search run history
app.get('/api/runs', (req, res) => {
  const limit = Number(req.query.limit) || 20;
  const runs = stmts.getSearchRuns.all(limit);
  res.json(runs);
});

// ── Auto-Apply Routes ───────────────────────────────────────────────

let applyInProgress = false;
let applyResults = null;

// Apply to a single job by ID (smart routing: API first, then Playwright)
app.post('/api/jobs/:id/apply', async (req, res) => {
  const job = stmts.getJobById.get(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  if (!job.url) return res.status(400).json({ error: 'Job has no URL' });

  res.json({ message: 'Apply started', jobId: job.id, url: job.url });

  try {
    const { smartApply } = require('./apply-agent/direct-apply');
    const result = await smartApply(job);
    console.log('[server] Smart apply result:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('[server] Apply failed:', err.message);
    stmts.logActivity.run('error', `Apply failed for job #${job.id}: ${err.message}`, job.id);
  }
});

// Auto-apply to Tier A (and optionally B) jobs
app.post('/api/apply/auto', async (req, res) => {
  if (applyInProgress) {
    return res.status(409).json({ error: 'Auto-apply already in progress' });
  }

  const { tiers = ['A'], maxApps = 5 } = req.body || {};
  applyInProgress = true;
  applyResults = null;

  res.json({ message: 'Auto-apply started', tiers, maxApps });

  try {
    const { batchSmartApply } = require('./apply-agent/direct-apply');

    // Get unapplied jobs from specified tiers — try ALL jobs with valid URLs
    let jobs = [];
    for (const tier of tiers) {
      const tierJobs = stmts.getJobsByTier.all(tier).filter(j => j.status === 'new' || j.status === 'saved');
      jobs.push(...tierJobs);
    }
    jobs.sort((a, b) => b.fit_score - a.fit_score);
    // ONLY auto-apply to proven working sources: Greenhouse board forms + Lever board forms
    jobs = jobs.filter(j => {
      if (!j.url || !j.url.startsWith('http')) return false;
      const url = j.url.toLowerCase();
      // Greenhouse board URLs (proven: Contentful, GitLab, Affirm, Mercury, Twilio)
      if (url.includes('job-boards.greenhouse.io') || url.includes('boards.greenhouse.io')) return true;
      // Lever hosted URLs
      if (url.includes('jobs.lever.co')) return true;
      return false;
    });

    if (jobs.length === 0) {
      applyResults = { total: 0, successful: 0, failed: 0, results: [], message: 'No unapplied jobs found in selected tiers' };
      applyInProgress = false;
      return;
    }

    applyResults = await batchSmartApply(jobs, { maxApps });
    console.log('[server] Auto-apply complete:', {
      total: applyResults.total,
      successful: applyResults.successful,
      failed: applyResults.failed,
    });
  } catch (err) {
    console.error('[server] Auto-apply failed:', err.message);
    applyResults = { error: err.message, total: 0, successful: 0, failed: 0, results: [] };
  } finally {
    applyInProgress = false;
  }
});

// Auto-apply status
app.get('/api/apply/status', (req, res) => {
  res.json({
    inProgress: applyInProgress,
    results: applyResults,
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), searchInProgress, applyInProgress });
});

// ── Cron: run search every 6 hours ─────────────────────────────────

cron.schedule(process.env.CRON_SCHEDULE || '0 */6 * * *', async () => {
  console.log(`[cron] Scheduled search starting at ${new Date().toISOString()}`);
  if (searchInProgress) {
    console.log('[cron] Skipping — search already in progress');
    return;
  }
  searchInProgress = true;
  try {
    const result = await runFullSearch();
    console.log('[cron] Scheduled search completed:', result);
  } catch (err) {
    console.error('[cron] Scheduled search failed:', err.message);
  } finally {
    searchInProgress = false;
  }
});

// ── Helpers ─────────────────────────────────────────────────────────

function safeParseJSON(str, fallback) {
  try { return JSON.parse(str); } catch { return fallback; }
}

// ── Start Server ────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║  Job Search API Server                                        ║
║  Running on port ${String(PORT).padEnd(44)}║
║  Cron: every 6 hours                                          ║
╚═══════════════════════════════════════════════════════════════╝
  `);
});
