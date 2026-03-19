// Smart Apply Engine — all routes go through Playwright browser
// Greenhouse/Lever APIs require auth keys, so browser is the proven path
// Tested: Successfully submitted to Contentful via Greenhouse browser form

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const PROFILE = require('../resume-profile');
const { stmts } = require('../db');

const RESUME_PATH = process.env.RESUME_PATH || path.join(__dirname, '..', '..', 'assets', 'Sonny_Gonzalez_Resume_2026.pdf');
const SCREENSHOT_DIR = process.env.SCREENSHOT_DIR || path.join(__dirname, '..', '..', 'data', 'screenshots');

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

function delay(min, max) { return new Promise(r => setTimeout(r, min + Math.random() * ((max || min) - min))); }

function log(jobId, msg) {
  console.log(`[apply] ${msg}`);
  try { stmts.logActivity.run('apply', msg, jobId || null); } catch {}
}

function screenshot(page, jobId, label) {
  try {
    if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    const file = path.join(SCREENSHOT_DIR, `job-${jobId}-${label}-${Date.now()}.png`);
    return page.screenshot({ path: file, fullPage: true }).then(() => file);
  } catch { return Promise.resolve(null); }
}

// ══════════════════════════════════════════════════════════════════════
// CORE: Fill any Greenhouse/Lever/generic form via Playwright
// Proven working — tested against real Contentful Greenhouse form
// ══════════════════════════════════════════════════════════════════════

async function browserApply(job, browser) {
  const result = { success: false, method: 'browser', fieldsFilled: [], errors: [], jobId: job.id };
  let page;

  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      userAgent: UA,
      locale: 'en-US',
      timezoneId: 'America/Los_Angeles',
    });
    page = await context.newPage();

    // ── Step 1: Navigate ──
    log(job.id, `Opening: ${job.title} @ ${job.company}`);
    let targetUrl = job.url;

    // For Greenhouse jobs hosted on company sites, go to the board URL directly
    if (targetUrl.includes('greenhouse.io')) {
      // Already a board URL — good
    } else if (job.external_id && job.external_id.startsWith('gh-')) {
      // We have the board info from scraping
      const parts = job.external_id.replace('gh-', '').split('-');
      const board = parts.slice(0, -1).join('-');
      const ghId = parts[parts.length - 1];
      targetUrl = `https://job-boards.greenhouse.io/${board}/jobs/${ghId}`;
    }

    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await delay(2000, 4000);

    // ── Step 2: Find & click Apply button if needed ──
    const pageTitle = await page.title();
    const isAlreadyOnForm = pageTitle.toLowerCase().includes('application') ||
      await page.locator('#first_name, input[name="first_name"], input[name="name"]').count() > 0;

    if (!isAlreadyOnForm) {
      log(job.id, 'Looking for Apply button...');
      const applyClicked = await clickApply(page);
      if (applyClicked) {
        await delay(2000, 4000);
        // Check if it opened a new page/iframe
        const frames = page.frames();
        const ghFrame = frames.find(f => f.url().includes('greenhouse'));
        if (ghFrame) {
          log(job.id, 'Found Greenhouse iframe');
          // Switch to the iframe for form filling
        }
      } else {
        // Maybe the form is below the fold
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await delay(1000, 2000);
      }
    }

    // ── Step 3: Fill standard fields ──
    log(job.id, 'Filling application form...');
    const fillMap = [
      { sels: ['#first_name', 'input[name="first_name"]', 'input[name="job_application[first_name]"]', 'input[autocomplete="given-name"]'], val: 'Sonny', label: 'First Name' },
      { sels: ['#last_name', 'input[name="last_name"]', 'input[name="job_application[last_name]"]', 'input[autocomplete="family-name"]'], val: 'Gonzalez', label: 'Last Name' },
      { sels: ['input[name="name"]', '#name'], val: 'Sonny R. Gonzalez', label: 'Full Name' },
      { sels: ['#email', 'input[name="email"]', 'input[type="email"]', 'input[name="job_application[email]"]'], val: PROFILE.email, label: 'Email' },
      { sels: ['#phone', 'input[name="phone"]', 'input[type="tel"]', 'input[name="job_application[phone]"]'], val: PROFILE.phone, label: 'Phone' },
      { sels: ['input[name*="linkedin" i]', 'input[placeholder*="LinkedIn" i]', 'input[id*="linkedin" i]', 'input[name*="url" i][placeholder*="linkedin" i]'], val: 'https://www.linkedin.com/in/sonnygonzalez', label: 'LinkedIn' },
      { sels: ['input[name*="website" i]', 'input[name*="portfolio" i]', 'input[placeholder*="website" i]', 'input[placeholder*="portfolio" i]', 'input[id*="website" i]'], val: 'https://aiforroi.co', label: 'Website' },
      { sels: ['input[name*="location" i]', 'input[id*="location" i]', 'input[placeholder*="location" i]', 'input[placeholder*="city" i]'], val: 'San Marcos, CA', label: 'Location' },
      { sels: ['input[name*="current_title" i]', 'input[placeholder*="current title" i]', 'input[name*="headline" i]'], val: 'Founder & AI Marketing Consultant', label: 'Current Title' },
      { sels: ['input[name*="current_company" i]', 'input[name*="org" i]', 'input[placeholder*="current company" i]'], val: 'AI FOR ROI', label: 'Current Company' },
    ];

    for (const field of fillMap) {
      for (const sel of field.sels) {
        try {
          const el = await page.locator(sel).first();
          if (await el.isVisible({ timeout: 500 })) {
            const currentVal = await el.evaluate(e => e.value);
            if (!currentVal) {
              await el.fill(field.val);
              result.fieldsFilled.push(field.label);
              break;
            }
          }
        } catch {}
      }
    }

    // ── Step 4: Handle dropdowns (work auth, experience level, etc.) ──
    const selects = await page.locator('select:visible').all();
    for (const sel of selects) {
      try {
        const label = await getLabel(page, sel);
        const options = await sel.evaluate(e => Array.from(e.options).map(o => ({ val: o.value, text: o.text.trim() })));

        if (!label) continue;
        const q = label.toLowerCase();

        let pick = null;
        if (q.includes('authorized') || q.includes('eligible') || q.includes('legally')) {
          pick = options.find(o => o.text.toLowerCase().includes('yes'));
        } else if (q.includes('sponsor') || q.includes('visa')) {
          pick = options.find(o => o.text.toLowerCase().includes('no'));
        } else if (q.includes('experience') || q.includes('seniority')) {
          pick = options.find(o => o.text.toLowerCase().includes('executive') || o.text.includes('10'));
        } else if (q.includes('hear') || q.includes('source') || q.includes('how did you')) {
          pick = options.find(o => o.text.toLowerCase().includes('linkedin') || o.text.toLowerCase().includes('job board') || o.text.toLowerCase().includes('online'));
        } else if (q.includes('gender')) {
          pick = options.find(o => o.text.toLowerCase().includes('prefer not') || o.text.toLowerCase().includes('decline'));
        } else if (q.includes('race') || q.includes('ethnic')) {
          pick = options.find(o => o.text.toLowerCase().includes('prefer not') || o.text.toLowerCase().includes('decline'));
        } else if (q.includes('veteran')) {
          pick = options.find(o => o.text.toLowerCase().includes('not a') || o.text.toLowerCase().includes('no'));
        } else if (q.includes('disability')) {
          pick = options.find(o => o.text.toLowerCase().includes('do not wish') || o.text.toLowerCase().includes('prefer not'));
        }

        if (pick) {
          await sel.selectOption(pick.val);
          result.fieldsFilled.push(label);
        }
      } catch {}
    }

    // ── Step 5: Handle textareas (cover letter, custom questions) ──
    const textareas = await page.locator('textarea:visible').all();
    for (const ta of textareas) {
      try {
        const currentVal = await ta.evaluate(e => e.value);
        if (currentVal) continue;
        const label = await getLabel(page, ta);
        const q = (label || '').toLowerCase();

        let answer;
        if (q.includes('cover') || q.includes('letter') || q.includes('interest')) {
          answer = job.cover_letter || generateCoverSnippet(job);
        } else if (q.includes('additional') || q.includes('comment') || q.includes('anything else')) {
          answer = generateCoverSnippet(job);
        } else {
          answer = generateCoverSnippet(job);
        }

        await ta.fill(answer);
        result.fieldsFilled.push(label || 'textarea');
      } catch {}
    }

    // ── Step 6: Upload resume ──
    log(job.id, 'Uploading resume...');
    try {
      if (fs.existsSync(RESUME_PATH)) {
        const fileInputs = await page.locator('input[type="file"]').all();
        for (const fi of fileInputs) {
          const accept = await fi.evaluate(e => e.accept || '');
          const name = await fi.evaluate(e => e.name || e.id || '');
          // Upload resume to the first file input (or one that looks like resume)
          if (!accept || accept.includes('pdf') || name.toLowerCase().includes('resume') || name.toLowerCase().includes('cv')) {
            await fi.setInputFiles(RESUME_PATH);
            result.fieldsFilled.push('Resume');
            log(job.id, 'Resume uploaded');
            break;
          }
        }
      }
    } catch (e) {
      result.errors.push('Resume upload: ' + e.message);
    }

    // ── Step 7: Check required checkboxes (terms, agreements) ──
    const checkboxes = await page.locator('input[type="checkbox"]:not(:checked):visible').all();
    for (const cb of checkboxes) {
      try {
        const label = await getLabel(page, cb);
        if (!label) continue;
        const q = label.toLowerCase();
        if (q.includes('agree') || q.includes('terms') || q.includes('acknowledge') || q.includes('consent') || q.includes('confirm') || q.includes('certify') || q.includes('privacy')) {
          await cb.check();
          result.fieldsFilled.push('Checkbox: ' + label.substring(0, 40));
        }
      } catch {}
    }

    // ── Step 8: Pre-submit screenshot ──
    await screenshot(page, job.id, 'pre-submit');

    // ── Step 9: SUBMIT ──
    log(job.id, 'Submitting...');
    const submitted = await clickSubmit(page);

    if (submitted) {
      await delay(3000, 5000);
      const bodyText = await page.textContent('body').catch(() => '');
      const successWords = ['thank', 'submitted', 'received', 'confirmation', 'success', 'applied', 'we will review'];
      const isSuccess = successWords.some(s => bodyText.toLowerCase().includes(s));

      await screenshot(page, job.id, isSuccess ? 'success' : 'post-submit');

      if (isSuccess) {
        result.success = true;
        stmts.markApplied.run(job.id);
        log(job.id, `SUCCESS: Applied to ${job.title} @ ${job.company} (${result.fieldsFilled.length} fields)`);
      } else {
        // Might be multi-step — try filling next page and submitting again
        log(job.id, 'No confirmation yet — checking for multi-step form...');
        const nextFilled = await handleNextStep(page, job);
        if (nextFilled) {
          result.fieldsFilled.push(...nextFilled);
          const reSubmit = await clickSubmit(page);
          if (reSubmit) {
            await delay(3000, 5000);
            const bodyText2 = await page.textContent('body').catch(() => '');
            if (successWords.some(s => bodyText2.toLowerCase().includes(s))) {
              result.success = true;
              stmts.markApplied.run(job.id);
              log(job.id, `SUCCESS (multi-step): Applied to ${job.title} @ ${job.company}`);
            }
          }
        }
        if (!result.success) {
          result.errors.push('Submitted but no confirmation detected');
        }
      }
    } else {
      result.errors.push('Could not find submit button');
      await screenshot(page, job.id, 'no-submit');
    }

    await context.close();
  } catch (err) {
    result.errors.push(err.message);
    log(job.id, `FAILED: ${err.message}`);
    if (page) await screenshot(page, job.id, 'error').catch(() => {});
  }

  return result;
}

// ══════════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════════

async function clickApply(page) {
  const texts = ['Apply Now', 'Apply for this job', 'Apply', 'Easy Apply', 'Quick Apply', 'Apply Here', 'Submit Application'];
  for (const text of texts) {
    try {
      const btn = await page.locator(`button:has-text("${text}"), a:has-text("${text}"), input[value="${text}"]`).first();
      if (await btn.isVisible({ timeout: 1000 })) {
        await delay(500, 1500);
        await btn.click();
        return true;
      }
    } catch {}
  }
  return false;
}

async function clickSubmit(page) {
  // Try specific submit selectors first
  const selectors = ['#submit_app', 'input[type="submit"]', 'button[type="submit"]'];
  for (const sel of selectors) {
    try {
      const btn = await page.locator(sel).first();
      if (await btn.isVisible({ timeout: 1000 })) {
        await btn.click();
        return true;
      }
    } catch {}
  }
  // Try text-based
  const texts = ['Submit Application', 'Submit', 'Apply', 'Send Application', 'Complete Application'];
  for (const text of texts) {
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

async function handleNextStep(page, job) {
  // For multi-step forms — fill any new fields that appeared and click Next/Continue
  const filled = [];
  const nextTexts = ['Next', 'Continue', 'Next Step', 'Proceed'];
  for (const text of nextTexts) {
    try {
      const btn = await page.locator(`button:has-text("${text}")`).first();
      if (await btn.isVisible({ timeout: 1000 })) {
        await btn.click();
        await delay(2000, 3000);
        filled.push('Next step');
        break;
      }
    } catch {}
  }
  return filled.length > 0 ? filled : null;
}

async function getLabel(page, element) {
  try {
    const ariaLabel = await element.evaluate(e => e.getAttribute('aria-label'));
    if (ariaLabel) return ariaLabel;
    const id = await element.evaluate(e => e.id);
    if (id) {
      const label = await page.$(`label[for="${id}"]`);
      if (label) return await label.evaluate(e => e.textContent.trim());
    }
    const parentLabel = await element.evaluate(e => {
      const l = e.closest('label');
      return l ? l.textContent.trim() : null;
    });
    if (parentLabel) return parentLabel;
    const prev = await element.evaluate(e => {
      const p = e.previousElementSibling;
      return p && ['LABEL', 'SPAN', 'DIV', 'P'].includes(p.tagName) ? p.textContent.trim() : null;
    });
    return prev;
  } catch { return null; }
}

function generateCoverSnippet(job) {
  return `I am excited to apply for the ${job.title} role at ${job.company}. With 10+ years of marketing leadership experience — including managing a $60M P&L, driving 300% YOY sales growth, and currently operating 10+ autonomous AI systems as Founder of AI FOR ROI — I bring a unique combination of strategic marketing expertise and hands-on AI execution. I've built complete marketing engines from zero at companies across solar, wildfire defense tech, and hospitality. I would welcome the opportunity to bring this experience to ${job.company}.`;
}

// ══════════════════════════════════════════════════════════════════════
// BATCH APPLY — applies to multiple jobs with human-like pacing
// ══════════════════════════════════════════════════════════════════════

async function batchSmartApply(jobs, options = {}) {
  const maxApps = Math.min(jobs.length, options.maxApps || 10);
  const results = [];
  let successful = 0;
  let failed = 0;

  log(null, `Starting batch apply: ${maxApps} jobs`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    for (let i = 0; i < maxApps; i++) {
      const job = jobs[i];
      log(job.id, `[${i + 1}/${maxApps}] ${job.title} @ ${job.company}`);

      const result = await browserApply(job, browser);
      results.push({ jobId: job.id, title: job.title, company: job.company, ...result });

      if (result.success) successful++;
      else failed++;

      // Human-like pause: 30-75 seconds between apps
      if (i < maxApps - 1) {
        const pause = 30000 + Math.random() * 45000;
        log(null, `Pausing ${Math.round(pause / 1000)}s before next application...`);
        await new Promise(r => setTimeout(r, pause));
      }
    }
  } finally {
    await browser.close();
  }

  const summary = { total: results.length, successful, failed, results };
  log(null, `Batch complete: ${successful} applied, ${failed} failed out of ${results.length}`);
  return summary;
}

// Single job apply (used by /api/jobs/:id/apply)
async function smartApply(job) {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
    const result = await browserApply(job, browser);
    return result;
  } finally {
    await browser.close();
  }
}

module.exports = { smartApply, batchSmartApply, browserApply };
