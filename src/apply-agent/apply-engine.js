// Auto-Apply Engine — orchestrates the full application flow
// Handles: ATS detection → form filling → resume upload → submission
// With human-like pacing and detailed logging

const { chromium } = require('playwright');
const { detectATS, detectATSFromPage } = require('./ats-detector');
const { fillApplicationForm, uploadResume, answerWithAI } = require('./form-filler');
const { stmts } = require('../db');

// ── Configuration ────────────────────────────────────────────────────

const CONFIG = {
  // Human-like delays (ms)
  minDelay: 1500,
  maxDelay: 4000,
  typingDelay: 50,       // ms between keystrokes
  pageLoadWait: 3000,
  betweenApps: 45000,    // 45s-90s between applications
  maxBetweenApps: 90000,

  // Safety limits
  maxAppsPerRun: 10,     // Don't blast too many at once
  maxAppsPerDay: 25,     // Daily cap

  // Browser settings
  headless: process.env.HEADLESS !== 'false',
  viewport: { width: 1440, height: 900 },
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
};

// ── Helpers ──────────────────────────────────────────────────────────

function randomDelay(min = CONFIG.minDelay, max = CONFIG.maxDelay) {
  return new Promise(resolve => setTimeout(resolve, min + Math.random() * (max - min)));
}

function log(jobId, type, message) {
  console.log(`[apply-engine] [${type}] ${message}`);
  try { stmts.logActivity.run(type, message, jobId || null); } catch {}
}

// ── Core Apply Function ──────────────────────────────────────────────

/**
 * Apply to a single job
 * Returns: { success, atsType, fieldsFilled, errors, screenshot }
 */
async function applyToJob(job, browser) {
  const result = {
    jobId: job.id,
    success: false,
    atsType: null,
    fieldsFilled: [],
    errors: [],
    skipped: [],
    aiAnswered: [],
    screenshotPath: null,
    appliedUrl: null,
  };

  let page;
  try {
    // 1. Create a fresh page with human-like settings
    const context = await browser.newContext({
      viewport: CONFIG.viewport,
      userAgent: CONFIG.userAgent,
      locale: 'en-US',
      timezoneId: 'America/Los_Angeles',
    });
    page = await context.newPage();

    // Block unnecessary resources for speed
    await page.route('**/*.{png,jpg,jpeg,gif,svg,woff,woff2,ttf}', route => route.abort());

    log(job.id, 'apply', `Opening: ${job.title} @ ${job.company}`);

    // 2. Navigate to the job posting
    await page.goto(job.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await randomDelay(2000, 4000);

    // 3. Detect ATS
    const ats = await detectATSFromPage(page);
    result.atsType = ats.type;
    log(job.id, 'apply', `ATS detected: ${ats.name}`);

    // 4. Find and click "Apply" button
    const applyClicked = await clickApplyButton(page, ats);
    if (!applyClicked) {
      // Try to find an external apply link
      const externalLink = await findExternalApplyLink(page);
      if (externalLink) {
        log(job.id, 'apply', `Following external apply link: ${externalLink}`);
        await page.goto(externalLink, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await randomDelay(2000, 3000);
        // Re-detect ATS on new page
        const newAts = await detectATSFromPage(page);
        result.atsType = newAts.type;
        Object.assign(ats, newAts);
      } else {
        result.errors.push('Could not find apply button');
        log(job.id, 'error', `No apply button found for ${job.company}`);
        await takeScreenshot(page, job.id, 'no-apply-button');
        await context.close();
        return result;
      }
    }

    await randomDelay(2000, 4000);

    // 5. Fill the application form
    log(job.id, 'apply', `Filling form (${ats.name})...`);
    const fillResults = await fillApplicationForm(page, ats, job);
    result.fieldsFilled = fillResults.filled;
    result.skipped = fillResults.skipped;
    result.aiAnswered = fillResults.aiAnswered;
    result.errors.push(...fillResults.errors.map(e => e.error));

    // 6. Upload resume
    const resumeResult = await uploadResume(page, ats);
    if (resumeResult.success) {
      log(job.id, 'apply', 'Resume uploaded');
      result.fieldsFilled.push({ field: 'resume', value: 'uploaded', method: 'file' });
    } else {
      log(job.id, 'apply', `Resume upload: ${resumeResult.reason}`);
      result.skipped.push({ field: 'resume', reason: resumeResult.reason });
    }

    await randomDelay(1500, 3000);

    // 7. Take a pre-submit screenshot for review
    result.screenshotPath = await takeScreenshot(page, job.id, 'pre-submit');

    // 8. Submit the application
    log(job.id, 'apply', `Submitting application...`);
    const submitted = await submitApplication(page, ats);

    if (submitted) {
      await randomDelay(2000, 4000);

      // Check for success indicators
      const pageText = await page.textContent('body').catch(() => '');
      const successIndicators = ['thank', 'submitted', 'received', 'confirmation', 'success', 'applied'];
      const isSuccess = successIndicators.some(s => pageText.toLowerCase().includes(s));

      if (isSuccess) {
        result.success = true;
        result.appliedUrl = page.url();
        log(job.id, 'apply', `SUCCESS: Applied to ${job.title} @ ${job.company}`);
        await takeScreenshot(page, job.id, 'success');

        // Update job status in DB
        stmts.markApplied.run(job.id);
      } else {
        // Might have multi-step form
        log(job.id, 'apply', 'Submitted but no success confirmation — may need additional steps');
        result.errors.push('No success confirmation detected — may be multi-step');
        await takeScreenshot(page, job.id, 'post-submit');
      }
    } else {
      result.errors.push('Could not find or click submit button');
      log(job.id, 'error', `Submit failed for ${job.company}`);
      await takeScreenshot(page, job.id, 'submit-failed');
    }

    await context.close();

  } catch (err) {
    result.errors.push(err.message);
    log(job.id, 'error', `Apply failed: ${err.message}`);
    if (page) await takeScreenshot(page, job.id, 'error').catch(() => {});
  }

  return result;
}

// ── Button Finding ───────────────────────────────────────────────────

async function clickApplyButton(page, ats) {
  // Try ATS-specific selectors first
  for (const selector of ats.applyButtonSelectors) {
    try {
      const btn = await page.$(selector);
      if (btn) {
        const isVisible = await btn.isVisible();
        if (isVisible) {
          await randomDelay(500, 1500);
          await btn.click();
          return true;
        }
      }
    } catch {}
  }

  // Try text-based selectors
  const applyTexts = ['Apply Now', 'Apply', 'Apply for this job', 'Apply for this position',
    'Easy Apply', 'Quick Apply', 'Submit Application', 'Apply Here'];
  for (const text of applyTexts) {
    try {
      const btn = await page.locator(`button:has-text("${text}"), a:has-text("${text}")`).first();
      if (await btn.isVisible({ timeout: 1000 })) {
        await randomDelay(500, 1500);
        await btn.click();
        return true;
      }
    } catch {}
  }

  return false;
}

async function findExternalApplyLink(page) {
  try {
    const links = await page.$$eval('a[href]', anchors =>
      anchors
        .filter(a => {
          const text = (a.textContent || '').toLowerCase();
          const href = a.href || '';
          return (text.includes('apply') || text.includes('submit')) &&
                 (href.includes('greenhouse') || href.includes('lever') ||
                  href.includes('workable') || href.includes('ashby') ||
                  href.includes('apply'));
        })
        .map(a => a.href)
    );
    return links[0] || null;
  } catch {
    return null;
  }
}

async function submitApplication(page, ats) {
  // Try ATS submit selectors
  for (const selector of ats.applyButtonSelectors) {
    try {
      const btn = await page.$(selector);
      if (btn && await btn.isVisible()) {
        await btn.click();
        return true;
      }
    } catch {}
  }

  // Try generic submit
  const submitTexts = ['Submit Application', 'Submit', 'Apply', 'Send Application',
    'Complete Application', 'Finish'];
  for (const text of submitTexts) {
    try {
      const btn = await page.locator(`button:has-text("${text}"), input[value="${text}"]`).first();
      if (await btn.isVisible({ timeout: 1000 })) {
        await btn.click();
        return true;
      }
    } catch {}
  }

  return false;
}

// ── Screenshots ──────────────────────────────────────────────────────

async function takeScreenshot(page, jobId, label) {
  try {
    const fs = require('fs');
    const dir = process.env.SCREENSHOT_DIR || require('path').join(__dirname, '..', '..', 'data', 'screenshots');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const filename = `job-${jobId}-${label}-${Date.now()}.png`;
    const filepath = require('path').join(dir, filename);
    await page.screenshot({ path: filepath, fullPage: true });
    return filepath;
  } catch {
    return null;
  }
}

// ── Multi-Step Form Handler ──────────────────────────────────────────

/**
 * Handle multi-page application forms (Greenhouse, Lever, LinkedIn)
 */
async function handleMultiStepForm(page, ats, job, maxSteps = 5) {
  for (let step = 0; step < maxSteps; step++) {
    log(job.id, 'apply', `Form step ${step + 1}...`);

    // Fill whatever's on the current step
    await fillApplicationForm(page, ats, job);
    await uploadResume(page, ats);

    await randomDelay(1000, 2000);

    // Look for "Next" / "Continue" button
    const nextTexts = ['Next', 'Continue', 'Next Step', 'Proceed'];
    let clickedNext = false;
    for (const text of nextTexts) {
      try {
        const btn = await page.locator(`button:has-text("${text}")`).first();
        if (await btn.isVisible({ timeout: 1000 })) {
          await btn.click();
          clickedNext = true;
          await randomDelay(2000, 3000);
          break;
        }
      } catch {}
    }

    if (!clickedNext) {
      // No next button — we're on the last step, try to submit
      return await submitApplication(page, ats);
    }
  }
  return false;
}

// ── Batch Apply Orchestrator ─────────────────────────────────────────

/**
 * Apply to multiple jobs with human-like pacing
 */
async function runApplyBatch(jobs, options = {}) {
  const maxApps = Math.min(jobs.length, options.maxApps || CONFIG.maxAppsPerRun);
  const results = [];

  log(null, 'apply', `Starting batch apply: ${maxApps} jobs`);

  const browser = await chromium.launch({
    headless: CONFIG.headless,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    for (let i = 0; i < maxApps; i++) {
      const job = jobs[i];
      log(job.id, 'apply', `[${i + 1}/${maxApps}] Applying to: ${job.title} @ ${job.company}`);

      const result = await applyToJob(job, browser);
      results.push(result);

      // Human-like pause between applications
      if (i < maxApps - 1) {
        const pause = CONFIG.betweenApps + Math.random() * (CONFIG.maxBetweenApps - CONFIG.betweenApps);
        log(null, 'apply', `Pausing ${Math.round(pause / 1000)}s before next application...`);
        await new Promise(r => setTimeout(r, pause));
      }
    }
  } finally {
    await browser.close();
  }

  // Summary
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  log(null, 'apply', `Batch complete: ${successful} applied, ${failed} failed out of ${results.length}`);

  return {
    total: results.length,
    successful,
    failed,
    results,
  };
}

// ── Tier-Based Auto Apply ────────────────────────────────────────────

/**
 * Auto-apply to all Tier A jobs, then optionally Tier B
 */
async function autoApply(options = {}) {
  const tiers = options.tiers || ['A'];
  const maxApps = options.maxApps || CONFIG.maxAppsPerRun;

  // Get unapplied jobs from specified tiers
  let jobs = [];
  for (const tier of tiers) {
    const tierJobs = stmts.getJobsByTier.all(tier)
      .filter(j => j.status === 'new' || j.status === 'saved');
    jobs.push(...tierJobs);
  }

  // Sort by score descending
  jobs.sort((a, b) => b.fit_score - a.fit_score);

  // Filter out jobs without URLs
  jobs = jobs.filter(j => j.url && j.url.startsWith('http'));

  if (jobs.length === 0) {
    log(null, 'apply', 'No unapplied jobs found for specified tiers');
    return { total: 0, successful: 0, failed: 0, results: [] };
  }

  log(null, 'apply', `Found ${jobs.length} jobs to apply to (tiers: ${tiers.join(',')})`);

  return runApplyBatch(jobs.slice(0, maxApps), { maxApps });
}

module.exports = {
  applyToJob,
  runApplyBatch,
  autoApply,
  CONFIG,
};
