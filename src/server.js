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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), searchInProgress });
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
