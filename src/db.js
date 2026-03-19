const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'jobs.db');

// Ensure data directory exists
const fs = require('fs');
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── Schema ──────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    external_id TEXT,
    source TEXT NOT NULL,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT DEFAULT '',
    url TEXT DEFAULT '',
    salary TEXT DEFAULT '',
    date_posted TEXT DEFAULT '',
    description TEXT DEFAULT '',
    query TEXT DEFAULT '',
    fit_score INTEGER DEFAULT 0,
    tier TEXT DEFAULT 'D',
    match_reasons TEXT DEFAULT '[]',
    ai_analysis TEXT DEFAULT '',
    status TEXT DEFAULT 'new',
    cover_letter TEXT DEFAULT '',
    linkedin_msg TEXT DEFAULT '',
    email_msg TEXT DEFAULT '',
    applied_at TEXT,
    notes TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(title, company)
  );

  CREATE TABLE IF NOT EXISTS search_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    started_at TEXT DEFAULT (datetime('now')),
    completed_at TEXT,
    jobs_found INTEGER DEFAULT 0,
    jobs_new INTEGER DEFAULT 0,
    tier_a INTEGER DEFAULT 0,
    tier_b INTEGER DEFAULT 0,
    tier_c INTEGER DEFAULT 0,
    status TEXT DEFAULT 'running',
    error TEXT
  );

  CREATE TABLE IF NOT EXISTS activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    job_id INTEGER,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (job_id) REFERENCES jobs(id)
  );

  CREATE INDEX IF NOT EXISTS idx_jobs_tier ON jobs(tier);
  CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
  CREATE INDEX IF NOT EXISTS idx_jobs_score ON jobs(fit_score DESC);
  CREATE INDEX IF NOT EXISTS idx_jobs_created ON jobs(created_at DESC);
`);

// ── Prepared Statements ─────────────────────────────────────────────

const stmts = {
  upsertJob: db.prepare(`
    INSERT INTO jobs (external_id, source, title, company, location, url, salary, date_posted, description, query, fit_score, tier, match_reasons, ai_analysis, cover_letter, linkedin_msg, email_msg)
    VALUES (@external_id, @source, @title, @company, @location, @url, @salary, @date_posted, @description, @query, @fit_score, @tier, @match_reasons, @ai_analysis, @cover_letter, @linkedin_msg, @email_msg)
    ON CONFLICT(title, company) DO UPDATE SET
      fit_score = CASE WHEN excluded.fit_score > jobs.fit_score THEN excluded.fit_score ELSE jobs.fit_score END,
      tier = CASE WHEN excluded.fit_score > jobs.fit_score THEN excluded.tier ELSE jobs.tier END,
      match_reasons = CASE WHEN excluded.fit_score > jobs.fit_score THEN excluded.match_reasons ELSE jobs.match_reasons END,
      ai_analysis = CASE WHEN excluded.ai_analysis != '' THEN excluded.ai_analysis ELSE jobs.ai_analysis END,
      updated_at = datetime('now')
  `),

  getAllJobs: db.prepare(`
    SELECT * FROM jobs ORDER BY fit_score DESC, created_at DESC
  `),

  getJobsByTier: db.prepare(`
    SELECT * FROM jobs WHERE tier = ? ORDER BY fit_score DESC
  `),

  getJobsByStatus: db.prepare(`
    SELECT * FROM jobs WHERE status = ? ORDER BY fit_score DESC
  `),

  getJobById: db.prepare(`
    SELECT * FROM jobs WHERE id = ?
  `),

  updateJobStatus: db.prepare(`
    UPDATE jobs SET status = ?, updated_at = datetime('now') WHERE id = ?
  `),

  markApplied: db.prepare(`
    UPDATE jobs SET status = 'applied', applied_at = datetime('now'), updated_at = datetime('now') WHERE id = ?
  `),

  updateJobNotes: db.prepare(`
    UPDATE jobs SET notes = ?, updated_at = datetime('now') WHERE id = ?
  `),

  getStats: db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN tier = 'A' THEN 1 ELSE 0 END) as tier_a,
      SUM(CASE WHEN tier = 'B' THEN 1 ELSE 0 END) as tier_b,
      SUM(CASE WHEN tier = 'C' THEN 1 ELSE 0 END) as tier_c,
      SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as status_new,
      SUM(CASE WHEN status = 'saved' THEN 1 ELSE 0 END) as saved,
      SUM(CASE WHEN status = 'applied' THEN 1 ELSE 0 END) as applied,
      SUM(CASE WHEN status = 'interviewing' THEN 1 ELSE 0 END) as interviewing,
      SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
      SUM(CASE WHEN status = 'offer' THEN 1 ELSE 0 END) as offers
    FROM jobs WHERE tier IN ('A', 'B', 'C')
  `),

  getRecentJobs: db.prepare(`
    SELECT * FROM jobs WHERE tier IN ('A', 'B', 'C') ORDER BY created_at DESC LIMIT ?
  `),

  createSearchRun: db.prepare(`
    INSERT INTO search_runs (status) VALUES ('running')
  `),

  completeSearchRun: db.prepare(`
    UPDATE search_runs SET completed_at = datetime('now'), jobs_found = ?, jobs_new = ?, tier_a = ?, tier_b = ?, tier_c = ?, status = 'completed' WHERE id = ?
  `),

  failSearchRun: db.prepare(`
    UPDATE search_runs SET completed_at = datetime('now'), status = 'failed', error = ? WHERE id = ?
  `),

  getSearchRuns: db.prepare(`
    SELECT * FROM search_runs ORDER BY started_at DESC LIMIT ?
  `),

  logActivity: db.prepare(`
    INSERT INTO activity_log (type, message, job_id) VALUES (?, ?, ?)
  `),

  getActivityLog: db.prepare(`
    SELECT * FROM activity_log ORDER BY created_at DESC LIMIT ?
  `),

  searchJobs: db.prepare(`
    SELECT * FROM jobs WHERE (title LIKE ? OR company LIKE ?) AND tier IN ('A', 'B', 'C') ORDER BY fit_score DESC
  `),
};

// ── Helper Functions ────────────────────────────────────────────────

function upsertJob(job) {
  return stmts.upsertJob.run({
    external_id: job.external_id || '',
    source: job.source,
    title: job.title,
    company: job.company,
    location: job.location || '',
    url: job.url || '',
    salary: job.salary || '',
    date_posted: job.datePosted || job.date_posted || '',
    description: job.description || '',
    query: job.query || '',
    fit_score: job.fitScore || job.fit_score || 0,
    tier: job.tier || 'D',
    match_reasons: JSON.stringify(job.matchReasons || job.match_reasons || []),
    ai_analysis: job.ai_analysis || '',
    cover_letter: job.cover_letter || '',
    linkedin_msg: job.linkedin_msg || '',
    email_msg: job.email_msg || '',
  });
}

function upsertMany(jobs) {
  const tx = db.transaction((jobList) => {
    let newCount = 0;
    for (const job of jobList) {
      const result = upsertJob(job);
      if (result.changes > 0 && result.lastInsertRowid) newCount++;
    }
    return newCount;
  });
  return tx(jobs);
}

module.exports = {
  db,
  stmts,
  upsertJob,
  upsertMany,
};
