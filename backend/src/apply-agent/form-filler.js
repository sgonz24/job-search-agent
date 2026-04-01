// AI-powered form filler — handles any application form
// Uses Claude to interpret custom questions and generate answers

const PROFILE = require('../resume-profile');
const path = require('path');
const fs = require('fs');

const RESUME_PATH = process.env.RESUME_PATH || path.join(__dirname, '..', '..', 'assets', 'Sonny_Gonzalez_Resume_2026.pdf');

// ── Core field values ────────────────────────────────────────────────

const FIELD_VALUES = {
  firstName: 'Sonny',
  lastName: 'Gonzalez',
  fullName: 'Sonny R. Gonzalez',
  email: PROFILE.email,
  phone: PROFILE.phone,
  location: PROFILE.location,
  city: 'San Marcos',
  state: 'California',
  stateAbbr: 'CA',
  zip: '92078',
  country: 'United States',
  linkedin: 'https://www.linkedin.com/in/sonnygonzalez',
  website: 'https://aiforroi.co',
  portfolio: 'https://aiforroi.co',
  github: '',
  currentTitle: 'Founder & AI Marketing Consultant',
  currentCompany: 'AI FOR ROI',
  yearsExperience: '10+',
  salaryExpectation: '175000',
  salaryRange: '$150,000 - $200,000',
  startDate: 'Immediately',
  workAuthorization: 'Yes',
  sponsorship: 'No',
  willingToRelocate: 'No',
  remotePreference: 'Remote',
  education: "Bachelor of Arts, Kinesiology — California State University, Chico, 2007",
  degree: "Bachelor of Arts",
  school: "California State University, Chico",
  graduationYear: '2007',
  veteranStatus: 'I am not a veteran',
  disabilityStatus: 'I do not wish to answer',
  gender: 'Male',
  race: 'I do not wish to answer',
  pronouns: 'He/Him',
};

// ── Smart field matcher ──────────────────────────────────────────────

/**
 * Given a label/placeholder/name, figure out what value to fill
 */
function matchFieldValue(identifier) {
  const id = identifier.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').trim();

  // Direct matches
  if (id.includes('first name') || id.includes('first_name') || id.includes('firstname')) return FIELD_VALUES.firstName;
  if (id.includes('last name') || id.includes('last_name') || id.includes('lastname')) return FIELD_VALUES.lastName;
  if ((id.includes('full name') || id === 'name') && !id.includes('company')) return FIELD_VALUES.fullName;
  if (id.includes('email')) return FIELD_VALUES.email;
  if (id.includes('phone') || id.includes('mobile') || id.includes('cell')) return FIELD_VALUES.phone;
  if (id.includes('linkedin')) return FIELD_VALUES.linkedin;
  if (id.includes('website') || id.includes('portfolio') || id.includes('personal url')) return FIELD_VALUES.website;
  if (id.includes('city')) return FIELD_VALUES.city;
  if (id.includes('state') || id.includes('province')) return FIELD_VALUES.state;
  if (id.includes('zip') || id.includes('postal')) return FIELD_VALUES.zip;
  if (id.includes('country')) return FIELD_VALUES.country;
  if (id.includes('location') || id.includes('address')) return FIELD_VALUES.location;
  if (id.includes('current title') || id.includes('job title') || id.includes('current role')) return FIELD_VALUES.currentTitle;
  if (id.includes('current company') || id.includes('current employer') || id.includes('company name')) return FIELD_VALUES.currentCompany;
  if (id.includes('years of experience') || id.includes('years experience')) return FIELD_VALUES.yearsExperience;
  if (id.includes('salary') || id.includes('compensation') || id.includes('desired pay')) return FIELD_VALUES.salaryExpectation;
  if (id.includes('start date') || id.includes('available') || id.includes('availability')) return FIELD_VALUES.startDate;
  if (id.includes('authorized') || id.includes('work authorization') || id.includes('legally authorized')) return FIELD_VALUES.workAuthorization;
  if (id.includes('sponsor') || id.includes('visa')) return FIELD_VALUES.sponsorship;
  if (id.includes('relocate') || id.includes('relocation')) return FIELD_VALUES.willingToRelocate;
  if (id.includes('remote') || id.includes('work preference') || id.includes('work arrangement')) return FIELD_VALUES.remotePreference;
  if (id.includes('education') || id.includes('degree')) return FIELD_VALUES.education;
  if (id.includes('school') || id.includes('university') || id.includes('college')) return FIELD_VALUES.school;
  if (id.includes('graduation') || id.includes('grad year')) return FIELD_VALUES.graduationYear;
  if (id.includes('veteran')) return FIELD_VALUES.veteranStatus;
  if (id.includes('disability') || id.includes('disabled')) return FIELD_VALUES.disabilityStatus;
  if (id.includes('gender')) return FIELD_VALUES.gender;
  if (id.includes('race') || id.includes('ethnicity')) return FIELD_VALUES.race;
  if (id.includes('pronoun')) return FIELD_VALUES.pronouns;
  if (id.includes('github')) return FIELD_VALUES.github;

  return null; // Unknown field — will use AI
}

// ── Select/dropdown matcher ──────────────────────────────────────────

/**
 * Given select options, pick the best one for a given field type
 */
function matchSelectOption(identifier, options) {
  const id = identifier.toLowerCase();

  // Yes/No questions
  const yesNoMap = {
    'authorized': 'yes', 'legally authorized': 'yes', 'eligible': 'yes',
    'sponsor': 'no', 'visa': 'no',
    'relocate': 'no', 'relocation': 'no',
    'remote': 'yes',
    '18 years': 'yes', 'age': 'yes',
  };

  for (const [key, val] of Object.entries(yesNoMap)) {
    if (id.includes(key)) {
      const match = options.find(o => o.toLowerCase().includes(val));
      if (match) return match;
    }
  }

  // Experience level
  if (id.includes('experience') || id.includes('seniority')) {
    const prefs = ['executive', 'vp', 'director', 'senior', '10+', '10', '8+', '7+'];
    for (const pref of prefs) {
      const match = options.find(o => o.toLowerCase().includes(pref));
      if (match) return match;
    }
  }

  // State
  if (id.includes('state')) {
    return options.find(o => o.includes('California') || o.includes('CA')) || null;
  }

  // Country
  if (id.includes('country')) {
    return options.find(o => o.includes('United States') || o.includes('US') || o.includes('USA')) || null;
  }

  // Gender
  if (id.includes('gender')) {
    const opt = options.find(o => o.toLowerCase().includes('male') && !o.toLowerCase().includes('female'));
    return opt || options.find(o => o.toLowerCase().includes('prefer not') || o.toLowerCase().includes('decline')) || null;
  }

  // Race/ethnicity
  if (id.includes('race') || id.includes('ethnicity')) {
    return options.find(o => o.toLowerCase().includes('prefer not') || o.toLowerCase().includes('decline') || o.toLowerCase().includes('do not wish')) || null;
  }

  // Veteran
  if (id.includes('veteran')) {
    return options.find(o => o.toLowerCase().includes('not a veteran') || o.toLowerCase().includes('no') || o.toLowerCase().includes('prefer not')) || null;
  }

  // Disability
  if (id.includes('disability')) {
    return options.find(o => o.toLowerCase().includes('do not wish') || o.toLowerCase().includes('prefer not') || o.toLowerCase().includes('no')) || null;
  }

  // How did you hear
  if (id.includes('hear') || id.includes('source') || id.includes('how did you find')) {
    return options.find(o => o.toLowerCase().includes('linkedin') || o.toLowerCase().includes('online') || o.toLowerCase().includes('job board')) || options[0];
  }

  return null;
}

// ── AI question answerer ─────────────────────────────────────────────

/**
 * Use Claude to answer custom application questions
 */
async function answerWithAI(question, context) {
  try {
    const Anthropic = require('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: `You are filling out a job application for Sonny R. Gonzalez. Answer concisely and professionally.
Here is his profile:
- ${PROFILE.headline}
- ${PROFILE.summary.substring(0, 500)}
- Key differentiator: Top 1% AI skills, builds production AI systems
- Experience: 10+ years marketing leadership, $60M P&L, 300% YOY growth
- Current: Founder @ AI FOR ROI, Director of Marketing @ SolarTech, Fractional CMO @ Ember Pro
- Seeking: VP of Marketing, Remote, $150K+

Rules:
- Be specific and use real accomplishments from his background
- Keep answers under 200 words unless the question asks for more
- Be confident but not arrogant
- Reference AI/automation capabilities when relevant
- Focus on measurable results`,
      messages: [{
        role: 'user',
        content: `Job application question for "${context.company}" (${context.title}):\n\n"${question}"\n\nWrite a compelling answer.`,
      }],
    });

    return response.content[0].text.trim();
  } catch (err) {
    console.error('[form-filler] AI answer failed:', err.message);
    // Fallback to a generic strong answer
    return `With 10+ years of marketing leadership experience, including managing a $60M P&L and driving 300% YOY sales growth, I bring a unique combination of strategic marketing expertise and hands-on AI automation skills. I currently operate 10+ production AI systems and serve as Fractional CMO for companies across solar energy, wildfire defense tech, and hospitality. I'm passionate about leveraging AI to transform marketing operations and drive measurable ROI.`;
  }
}

// ── Main form filling logic ──────────────────────────────────────────

/**
 * Fill all fields in a form on a Playwright page
 */
async function fillApplicationForm(page, atsConfig, job) {
  const results = { filled: [], skipped: [], errors: [], aiAnswered: [] };

  // 1. Fill known fields using ATS-specific selectors
  for (const [fieldName, selectors] of Object.entries(atsConfig.fieldMap)) {
    if (fieldName === 'resume') continue; // Handle separately

    for (const selector of selectors) {
      try {
        const el = await page.$(selector);
        if (!el) continue;

        const tagName = await el.evaluate(e => e.tagName.toLowerCase());
        const inputType = await el.evaluate(e => e.type || '');

        if (tagName === 'select') {
          // Handle dropdowns
          const options = await el.evaluate(e =>
            Array.from(e.options).map(o => o.text.trim()).filter(t => t)
          );
          const label = await getFieldLabel(page, el);
          const bestOption = matchSelectOption(label || fieldName, options);
          if (bestOption) {
            await el.selectOption({ label: bestOption });
            results.filled.push({ field: fieldName, value: bestOption, method: 'select' });
          }
        } else if (tagName === 'textarea' && fieldName === 'coverLetter') {
          // Fill cover letter
          const coverLetter = job.cover_letter || await answerWithAI('Write a cover letter for this position', { company: job.company, title: job.title });
          await el.fill(coverLetter);
          results.filled.push({ field: 'coverLetter', value: '(cover letter)', method: 'textarea' });
        } else if (tagName === 'input' || tagName === 'textarea') {
          const value = FIELD_VALUES[fieldName] || matchFieldValue(fieldName);
          if (value) {
            await el.fill('');
            await el.fill(value);
            results.filled.push({ field: fieldName, value, method: 'input' });
          }
        }
        break; // Found and filled — move to next field
      } catch (err) {
        // Selector didn't match, try next
      }
    }
  }

  // 2. Find and fill any remaining visible inputs we missed
  const allInputs = await page.$$('input:visible, textarea:visible, select:visible');
  for (const input of allInputs) {
    try {
      const name = await input.evaluate(e => e.name || '');
      const placeholder = await input.evaluate(e => e.placeholder || '');
      const value = await input.evaluate(e => e.value || '');
      const type = await input.evaluate(e => e.type || '');
      const required = await input.evaluate(e => e.required || e.getAttribute('aria-required') === 'true');

      // Skip if already filled, hidden, or file inputs
      if (value || type === 'file' || type === 'hidden' || type === 'submit' || type === 'button') continue;

      const label = await getFieldLabel(page, input);
      const identifier = label || placeholder || name;
      if (!identifier) continue;

      const tagName = await input.evaluate(e => e.tagName.toLowerCase());

      if (tagName === 'select') {
        const options = await input.evaluate(e =>
          Array.from(e.options).map(o => o.text.trim()).filter(t => t)
        );
        const bestOption = matchSelectOption(identifier, options);
        if (bestOption) {
          await input.selectOption({ label: bestOption });
          results.filled.push({ field: identifier, value: bestOption, method: 'auto-select' });
        } else if (required) {
          results.skipped.push({ field: identifier, reason: 'no matching option' });
        }
      } else if (tagName === 'textarea') {
        // Use AI for open-ended questions
        const answer = await answerWithAI(identifier, { company: job.company, title: job.title });
        await input.fill(answer);
        results.aiAnswered.push({ field: identifier, answer: answer.substring(0, 100) + '...' });
      } else {
        // Try to match by label
        const matchedValue = matchFieldValue(identifier);
        if (matchedValue) {
          await input.fill(matchedValue);
          results.filled.push({ field: identifier, value: matchedValue, method: 'auto-match' });
        } else if (required) {
          // Use AI for required fields we can't match
          const answer = await answerWithAI(identifier, { company: job.company, title: job.title });
          await input.fill(answer);
          results.aiAnswered.push({ field: identifier, answer: answer.substring(0, 100) + '...' });
        }
      }
    } catch (err) {
      results.errors.push({ error: err.message });
    }
  }

  // 3. Handle checkboxes (terms, agreements, etc.)
  const checkboxes = await page.$$('input[type="checkbox"]:not(:checked):visible');
  for (const cb of checkboxes) {
    try {
      const label = await getFieldLabel(page, cb);
      if (!label) continue;
      const labelLower = label.toLowerCase();
      // Only check agreement/terms boxes
      if (labelLower.includes('agree') || labelLower.includes('terms') ||
          labelLower.includes('acknowledge') || labelLower.includes('consent') ||
          labelLower.includes('confirm') || labelLower.includes('certify')) {
        await cb.check();
        results.filled.push({ field: label, value: 'checked', method: 'checkbox' });
      }
    } catch (err) {
      // Skip
    }
  }

  return results;
}

/**
 * Upload resume file
 */
async function uploadResume(page, atsConfig) {
  const selectors = atsConfig.fieldMap.resume || ['input[type="file"]'];
  for (const selector of selectors) {
    try {
      const fileInput = await page.$(selector);
      if (fileInput && fs.existsSync(RESUME_PATH)) {
        await fileInput.setInputFiles(RESUME_PATH);
        return { success: true, path: RESUME_PATH };
      }
    } catch (err) {
      // Try next selector
    }
  }
  return { success: false, reason: 'No file input found or resume missing' };
}

/**
 * Get the label text for a form element
 */
async function getFieldLabel(page, element) {
  try {
    // Try aria-label
    const ariaLabel = await element.evaluate(e => e.getAttribute('aria-label'));
    if (ariaLabel) return ariaLabel;

    // Try associated <label>
    const id = await element.evaluate(e => e.id);
    if (id) {
      const label = await page.$(`label[for="${id}"]`);
      if (label) return await label.evaluate(e => e.textContent.trim());
    }

    // Try parent label
    const parentLabel = await element.evaluate(e => {
      const label = e.closest('label');
      return label ? label.textContent.trim() : null;
    });
    if (parentLabel) return parentLabel;

    // Try preceding sibling label
    const siblingLabel = await element.evaluate(e => {
      const prev = e.previousElementSibling;
      if (prev && (prev.tagName === 'LABEL' || prev.tagName === 'SPAN' || prev.tagName === 'DIV')) {
        return prev.textContent.trim();
      }
      return null;
    });
    return siblingLabel;
  } catch {
    return null;
  }
}

module.exports = {
  FIELD_VALUES,
  matchFieldValue,
  matchSelectOption,
  answerWithAI,
  fillApplicationForm,
  uploadResume,
};
