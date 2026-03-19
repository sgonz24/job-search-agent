// Direct API Apply — submits applications without a browser
// Works with: Greenhouse API, Lever API
// These ATS platforms have public application endpoints

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const PROFILE = require('../resume-profile');
const { stmts } = require('../db');

const RESUME_PATH = process.env.RESUME_PATH || path.join(__dirname, '..', '..', 'assets', 'Sonny_Gonzalez_Resume_2026.pdf');

// ══════════════════════════════════════════════════════════════════════
// GREENHOUSE DIRECT APPLY
// Greenhouse has a public application submission API
// POST https://boards-api.greenhouse.io/v1/boards/{board}/jobs/{job_id}
// ══════════════════════════════════════════════════════════════════════

async function applyViaGreenhouse(job) {
  const result = { success: false, method: 'greenhouse-api', errors: [] };

  try {
    // Extract board token and job ID from URL
    // URL formats:
    //   https://boards.greenhouse.io/{board}/jobs/{id}
    //   https://job-boards.greenhouse.io/ts/{board}/jobs/{id}
    const urlMatch = job.url.match(/greenhouse\.io\/(?:ts\/)?(\w[\w-]+)\/jobs\/(\d+)/);
    if (!urlMatch) {
      result.errors.push('Could not parse Greenhouse URL');
      return result;
    }

    const [, boardToken, jobId] = urlMatch;

    // Build multipart form data
    const form = new FormData();
    form.append('first_name', 'Sonny');
    form.append('last_name', 'Gonzalez');
    form.append('email', PROFILE.email);
    form.append('phone', PROFILE.phone);
    form.append('location', PROFILE.location);

    // Resume file
    if (fs.existsSync(RESUME_PATH)) {
      form.append('resume', fs.createReadStream(RESUME_PATH), {
        filename: 'Sonny_Gonzalez_Resume_2026.pdf',
        contentType: 'application/pdf',
      });
    }

    // Cover letter
    if (job.cover_letter) {
      form.append('cover_letter', job.cover_letter);
    }

    // Additional fields Greenhouse commonly expects
    form.append('mapped_url_token', boardToken);

    const apiUrl = `https://boards-api.greenhouse.io/v1/boards/${boardToken}/jobs/${jobId}`;

    console.log(`[direct-apply] Greenhouse API: ${apiUrl}`);

    const res = await fetch(apiUrl, {
      method: 'POST',
      body: form,
      headers: {
        ...form.getHeaders(),
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      },
    });

    const responseText = await res.text();

    if (res.ok || res.status === 201 || res.status === 200) {
      result.success = true;
      console.log(`[direct-apply] Greenhouse: SUCCESS for ${job.company}`);
      stmts.markApplied.run(job.id);
      stmts.logActivity.run('apply', `Applied via Greenhouse API: ${job.title} @ ${job.company}`, job.id);
    } else {
      result.errors.push(`Greenhouse API ${res.status}: ${responseText.substring(0, 200)}`);
      console.log(`[direct-apply] Greenhouse: FAILED ${res.status} for ${job.company}`);
    }
  } catch (err) {
    result.errors.push(err.message);
    console.error(`[direct-apply] Greenhouse error: ${err.message}`);
  }

  return result;
}

// ══════════════════════════════════════════════════════════════════════
// LEVER DIRECT APPLY
// Lever has a public posting apply endpoint
// POST https://api.lever.co/v0/postings/{company}/{posting_id}?key=...
// ══════════════════════════════════════════════════════════════════════

async function applyViaLever(job) {
  const result = { success: false, method: 'lever-api', errors: [] };

  try {
    // Extract company and posting ID from URL
    // URL formats:
    //   https://jobs.lever.co/{company}/{posting_id}
    //   https://jobs.lever.co/{company}/{posting_id}/apply
    const urlMatch = job.url.match(/lever\.co\/(\w[\w-]+)\/([\w-]+)/);
    if (!urlMatch) {
      result.errors.push('Could not parse Lever URL');
      return result;
    }

    const [, company, postingId] = urlMatch;

    // Build multipart form data
    const form = new FormData();
    form.append('name', 'Sonny R. Gonzalez');
    form.append('email', PROFILE.email);
    form.append('phone', PROFILE.phone);
    form.append('org', PROFILE.experience[0].company); // Current company
    form.append('urls[LinkedIn]', 'https://www.linkedin.com/in/sonnygonzalez');
    form.append('urls[Portfolio]', 'https://aiforroi.co');
    form.append('comments', job.cover_letter || PROFILE.summary.substring(0, 500));

    // Resume file
    if (fs.existsSync(RESUME_PATH)) {
      form.append('resume', fs.createReadStream(RESUME_PATH), {
        filename: 'Sonny_Gonzalez_Resume_2026.pdf',
        contentType: 'application/pdf',
      });
    }

    const apiUrl = `https://api.lever.co/v0/postings/${company}/${postingId}?key=`;

    console.log(`[direct-apply] Lever API: ${company}/${postingId}`);

    const res = await fetch(apiUrl, {
      method: 'POST',
      body: form,
      headers: {
        ...form.getHeaders(),
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      },
    });

    const responseText = await res.text();

    if (res.ok || res.status === 201 || res.status === 200) {
      result.success = true;
      console.log(`[direct-apply] Lever: SUCCESS for ${job.company}`);
      stmts.markApplied.run(job.id);
      stmts.logActivity.run('apply', `Applied via Lever API: ${job.title} @ ${job.company}`, job.id);
    } else {
      result.errors.push(`Lever API ${res.status}: ${responseText.substring(0, 200)}`);
      console.log(`[direct-apply] Lever: FAILED ${res.status} for ${job.company}`);
    }
  } catch (err) {
    result.errors.push(err.message);
    console.error(`[direct-apply] Lever error: ${err.message}`);
  }

  return result;
}

// ══════════════════════════════════════════════════════════════════════
// SMART APPLY ROUTER
// Picks the best apply method for each job
// ══════════════════════════════════════════════════════════════════════

async function smartApply(job) {
  const url = (job.url || '').toLowerCase();

  // Route 1: Greenhouse API (fastest, most reliable)
  if (url.includes('greenhouse.io')) {
    console.log(`[smart-apply] Routing ${job.company} → Greenhouse API`);
    return applyViaGreenhouse(job);
  }

  // Route 2: Lever API
  if (url.includes('lever.co')) {
    console.log(`[smart-apply] Routing ${job.company} → Lever API`);
    return applyViaLever(job);
  }

  // Route 3: Playwright browser automation (for everything else)
  console.log(`[smart-apply] Routing ${job.company} → Playwright browser`);
  try {
    const { applyToJob } = require('./apply-engine');
    const { chromium } = require('playwright');
    const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const result = await applyToJob(job, browser);
    await browser.close();
    return result;
  } catch (err) {
    return { success: false, method: 'playwright', errors: [err.message] };
  }
}

// ══════════════════════════════════════════════════════════════════════
// BATCH SMART APPLY
// Applies to multiple jobs using the best method for each
// ══════════════════════════════════════════════════════════════════════

async function batchSmartApply(jobs, options = {}) {
  const maxApps = Math.min(jobs.length, options.maxApps || 10);
  const results = [];
  let successful = 0;
  let failed = 0;

  console.log(`[batch-apply] Starting batch: ${maxApps} jobs`);

  for (let i = 0; i < maxApps; i++) {
    const job = jobs[i];
    console.log(`[batch-apply] [${i + 1}/${maxApps}] ${job.title} @ ${job.company}`);

    const result = await smartApply(job);
    results.push({ jobId: job.id, title: job.title, company: job.company, ...result });

    if (result.success) successful++;
    else failed++;

    // Human-like pause between applications (30-75 seconds)
    if (i < maxApps - 1) {
      const pause = 30000 + Math.random() * 45000;
      console.log(`[batch-apply] Pausing ${Math.round(pause / 1000)}s...`);
      await new Promise(r => setTimeout(r, pause));
    }
  }

  const summary = { total: results.length, successful, failed, results };
  console.log(`[batch-apply] Done: ${successful} applied, ${failed} failed`);
  stmts.logActivity.run('apply', `Batch apply: ${successful}/${results.length} successful`, null);

  return summary;
}

module.exports = { applyViaGreenhouse, applyViaLever, smartApply, batchSmartApply };
