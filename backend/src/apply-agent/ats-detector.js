// Detects which ATS (Applicant Tracking System) a job posting uses
// and returns the appropriate apply strategy

const ATS_PATTERNS = {
  greenhouse: {
    name: 'Greenhouse',
    urlPatterns: [
      /boards\.greenhouse\.io/i,
      /job-boards\.greenhouse\.io/i,
      /grnh\.se/i,
    ],
    applyButtonSelectors: [
      '#app_submit', 'input[type="submit"]', 'button[type="submit"]',
      '[data-test="submit-application"]',
    ],
    formSelectors: ['#application_form', '#job_application', 'form[action*="applications"]'],
    fieldMap: {
      firstName: ['#first_name', 'input[name="job_application[first_name]"]', 'input[autocomplete="given-name"]'],
      lastName: ['#last_name', 'input[name="job_application[last_name]"]', 'input[autocomplete="family-name"]'],
      email: ['#email', 'input[name="job_application[email]"]', 'input[type="email"]'],
      phone: ['#phone', 'input[name="job_application[phone]"]', 'input[type="tel"]'],
      resume: ['input[type="file"]', '#resume', 'input[name*="resume"]'],
      coverLetter: ['textarea[name*="cover_letter"]', '#cover_letter', 'textarea[name*="coverLetter"]'],
      linkedin: ['input[name*="linkedin"]', 'input[placeholder*="LinkedIn"]', 'input[name*="url"]'],
      website: ['input[name*="website"]', 'input[placeholder*="website"]', 'input[placeholder*="portfolio"]'],
      location: ['input[name*="location"]', '#location'],
    },
  },

  lever: {
    name: 'Lever',
    urlPatterns: [
      /jobs\.lever\.co/i,
      /lever\.co\/.*\/apply/i,
    ],
    applyButtonSelectors: [
      'button.postings-btn', 'button[type="submit"]',
      '.template-btn-submit', 'a[href*="/apply"]',
    ],
    formSelectors: ['form.application-form', '.postings-form', 'form[action*="applications"]'],
    fieldMap: {
      firstName: ['input[name="name"]', '#resume-name', 'input[placeholder*="name"]'],
      email: ['input[name="email"]', '#resume-email', 'input[type="email"]'],
      phone: ['input[name="phone"]', '#resume-phone', 'input[type="tel"]'],
      resume: ['input[type="file"]', '.resume-upload input', '#resume-upload'],
      coverLetter: ['textarea[name*="comments"]', 'textarea[name*="additional"]', '#additional-information'],
      linkedin: ['input[name*="urls[LinkedIn]"]', 'input[placeholder*="LinkedIn"]'],
      website: ['input[name*="urls[Portfolio]"]', 'input[name*="urls[Website]"]'],
      location: ['input[name*="location"]'],
    },
  },

  workable: {
    name: 'Workable',
    urlPatterns: [
      /apply\.workable\.com/i,
      /jobs\.workable\.com/i,
    ],
    applyButtonSelectors: [
      'button[type="submit"]', '.application-submit',
      '[data-ui="application-submit"]',
    ],
    formSelectors: ['form.application-form', '.application-page form'],
    fieldMap: {
      firstName: ['input[name="firstname"]', '#firstname'],
      lastName: ['input[name="lastname"]', '#lastname'],
      email: ['input[name="email"]', '#email', 'input[type="email"]'],
      phone: ['input[name="phone"]', '#phone', 'input[type="tel"]'],
      resume: ['input[type="file"]', '.resume-upload'],
      coverLetter: ['textarea[name*="cover"]', '#cover_letter'],
      linkedin: ['input[name*="linkedin"]'],
    },
  },

  ashby: {
    name: 'Ashby',
    urlPatterns: [
      /jobs\.ashbyhq\.com/i,
      /ashbyhq\.com/i,
    ],
    applyButtonSelectors: [
      'button[type="submit"]', '[data-testid="submit-application"]',
    ],
    formSelectors: ['form[data-testid="application-form"]', '.ashby-application-form'],
    fieldMap: {
      firstName: ['input[name="firstName"]', 'input[name="_systemfield_first_name"]'],
      lastName: ['input[name="lastName"]', 'input[name="_systemfield_last_name"]'],
      email: ['input[name="email"]', 'input[name="_systemfield_email"]', 'input[type="email"]'],
      phone: ['input[name="phone"]', 'input[name="_systemfield_phone"]', 'input[type="tel"]'],
      resume: ['input[type="file"]'],
      coverLetter: ['textarea[name*="cover"]'],
      linkedin: ['input[name*="linkedin"]'],
    },
  },

  linkedin: {
    name: 'LinkedIn Easy Apply',
    urlPatterns: [
      /linkedin\.com\/jobs/i,
    ],
    applyButtonSelectors: [
      '.jobs-apply-button', 'button[data-control-name="jobdetails_topcard_inapply"]',
      'button.jobs-apply-button--top-card',
    ],
    formSelectors: ['.jobs-easy-apply-content', '.jobs-easy-apply-modal'],
    fieldMap: {
      // LinkedIn pre-fills most fields from profile
      phone: ['input[name*="phoneNumber"]', 'input[id*="phoneNumber"]'],
      resume: ['input[type="file"]'],
      coverLetter: ['textarea'],
    },
  },

  generic: {
    name: 'Generic Application',
    urlPatterns: [],
    applyButtonSelectors: [
      'button[type="submit"]', 'input[type="submit"]',
      'a[href*="apply"]', 'button:has-text("Apply")',
      'button:has-text("Submit Application")', 'button:has-text("Submit")',
    ],
    formSelectors: ['form'],
    fieldMap: {
      firstName: ['input[name*="first"]', 'input[placeholder*="First"]', 'input[autocomplete="given-name"]'],
      lastName: ['input[name*="last"]', 'input[placeholder*="Last"]', 'input[autocomplete="family-name"]'],
      email: ['input[type="email"]', 'input[name*="email"]', 'input[placeholder*="email"]'],
      phone: ['input[type="tel"]', 'input[name*="phone"]', 'input[placeholder*="phone"]'],
      resume: ['input[type="file"]', 'input[name*="resume"]', 'input[accept*="pdf"]'],
      coverLetter: ['textarea[name*="cover"]', 'textarea[name*="letter"]', 'textarea[placeholder*="cover"]'],
      linkedin: ['input[name*="linkedin"]', 'input[placeholder*="LinkedIn"]'],
      website: ['input[name*="website"]', 'input[name*="portfolio"]', 'input[placeholder*="website"]'],
    },
  },
};

/**
 * Detect which ATS a URL belongs to
 */
function detectATS(url) {
  for (const [key, ats] of Object.entries(ATS_PATTERNS)) {
    if (key === 'generic') continue;
    for (const pattern of ats.urlPatterns) {
      if (pattern.test(url)) return { type: key, ...ats };
    }
  }
  return { type: 'generic', ...ATS_PATTERNS.generic };
}

/**
 * Detect ATS from page content (when URL isn't enough)
 */
async function detectATSFromPage(page) {
  const url = page.url();
  const detected = detectATS(url);
  if (detected.type !== 'generic') return detected;

  // Check page content for ATS signatures
  const html = await page.content();
  if (html.includes('greenhouse') || html.includes('Greenhouse')) return { type: 'greenhouse', ...ATS_PATTERNS.greenhouse };
  if (html.includes('lever.co') || html.includes('Lever')) return { type: 'lever', ...ATS_PATTERNS.lever };
  if (html.includes('workable') || html.includes('Workable')) return { type: 'workable', ...ATS_PATTERNS.workable };
  if (html.includes('ashby') || html.includes('Ashby')) return { type: 'ashby', ...ATS_PATTERNS.ashby };

  return detected;
}

module.exports = { ATS_PATTERNS, detectATS, detectATSFromPage };
