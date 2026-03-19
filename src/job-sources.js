// Job Board Search Sources — 13 boards for VP Marketing remote roles
const fetch = require('node-fetch');
const cheerio = require('cheerio');

const SEARCH_QUERIES = [
  "VP of Marketing remote",
  "Vice President Marketing remote",
  "Head of Marketing remote",
  "CMO remote",
  "VP Growth Marketing remote",
  "VP Digital Marketing remote",
  "VP Demand Generation remote",
  "VP Marketing AI",
  "VP Marketing SaaS remote",
  "VP Marketing technology remote",
  "Chief Marketing Officer remote",
  "SVP Marketing remote",
  "VP Brand Marketing remote",
];

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
const HEADERS = { 'User-Agent': UA, 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8', 'Accept-Language': 'en-US,en;q=0.9' };

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

// ══════════════════════════════════════════════════════════════════════
// 1. LINKEDIN (public guest search)
// ══════════════════════════════════════════════════════════════════════

async function searchLinkedIn(query) {
  const url = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(query)}&location=United%20States&f_WT=2&f_E=5%2C6&start=0`;
  try {
    const res = await fetch(url, { headers: HEADERS });
    const html = await res.text();
    const $ = cheerio.load(html);
    const jobs = [];
    $('div.base-card').each((i, el) => {
      const title = $(el).find('h3.base-search-card__title').text().trim();
      const company = $(el).find('h4.base-search-card__subtitle').text().trim();
      const location = $(el).find('span.job-search-card__location').text().trim();
      const link = $(el).find('a.base-card__full-link').attr('href') || '';
      const datePosted = $(el).find('time').attr('datetime') || '';
      if (title) jobs.push({ source: 'LinkedIn', title, company, location, url: link.split('?')[0], datePosted, query });
    });
    return jobs;
  } catch (err) { console.error(`  LinkedIn error: ${err.message}`); return []; }
}

// ══════════════════════════════════════════════════════════════════════
// 2. INDEED
// ══════════════════════════════════════════════════════════════════════

async function searchIndeed(query) {
  try {
    const res = await fetch(`https://www.indeed.com/jobs?q=${encodeURIComponent(query)}&l=Remote&sc=0kf%3Aattr(DSQF7)%3B&fromage=14&sort=date`, { headers: HEADERS });
    const html = await res.text();
    const $ = cheerio.load(html);
    const jobs = [];
    $('div.job_seen_beacon, div.jobsearch-ResultsList div.cardOutline').each((i, el) => {
      const title = $(el).find('h2.jobTitle span[title], h2 a span').text().trim();
      const company = $(el).find('span[data-testid="company-name"], span.companyName').text().trim();
      const location = $(el).find('div[data-testid="text-location"], div.companyLocation').text().trim();
      const jobId = $(el).find('a[data-jk]').attr('data-jk') || '';
      if (title) jobs.push({ source: 'Indeed', title, company, location, url: jobId ? `https://www.indeed.com/viewjob?jk=${jobId}` : '', query });
    });
    return jobs;
  } catch (err) { console.error(`  Indeed error: ${err.message}`); return []; }
}

// ══════════════════════════════════════════════════════════════════════
// 3. REMOTEOK (JSON API)
// ══════════════════════════════════════════════════════════════════════

async function searchRemoteOK() {
  try {
    const res = await fetch('https://remoteok.com/api', { headers: { 'User-Agent': UA, 'Accept': 'application/json' } });
    const data = await res.json();
    return data.filter(j => {
      if (!j.position) return false;
      const pos = j.position.toLowerCase();
      const tags = (j.tags || []).join(' ').toLowerCase();
      return (pos.includes('vp') || pos.includes('vice president') || pos.includes('head of') || pos.includes('cmo') || pos.includes('director'))
        && (pos.includes('marketing') || tags.includes('marketing'));
    }).map(j => ({
      source: 'RemoteOK', title: j.position, company: j.company || '', location: 'Remote',
      url: j.url ? (j.url.startsWith('http') ? j.url : `https://remoteok.com${j.url}`) : '', datePosted: j.date || '',
      salary: j.salary_min ? `$${j.salary_min}-$${j.salary_max}` : '', query: 'marketing',
    }));
  } catch (err) { console.error(`  RemoteOK error: ${err.message}`); return []; }
}

// ══════════════════════════════════════════════════════════════════════
// 4. WEWORKREMOTELY
// ══════════════════════════════════════════════════════════════════════

async function searchWWR() {
  try {
    const res = await fetch('https://weworkremotely.com/categories/remote-marketing-jobs', { headers: HEADERS });
    const html = await res.text();
    const $ = cheerio.load(html);
    const jobs = [];
    $('li.feature, li:not(.ad)').each((i, el) => {
      const title = $(el).find('span.title').text().trim();
      const company = $(el).find('span.company').text().trim();
      const link = $(el).find('a[href*="/remote-jobs/"]').last().attr('href') || '';
      if (title) {
        const pos = title.toLowerCase();
        if (pos.includes('vp') || pos.includes('vice president') || pos.includes('head of') || pos.includes('director') || pos.includes('cmo') || pos.includes('chief')) {
          jobs.push({ source: 'WWR', title, company, location: 'Remote', url: link.startsWith('http') ? link : `https://weworkremotely.com${link}`, query: 'marketing' });
        }
      }
    });
    return jobs;
  } catch (err) { console.error(`  WWR error: ${err.message}`); return []; }
}

// ══════════════════════════════════════════════════════════════════════
// 5. BUILTIN
// ══════════════════════════════════════════════════════════════════════

async function searchBuiltIn(query) {
  try {
    const res = await fetch(`https://builtin.com/jobs/remote?search=${encodeURIComponent(query)}`, { headers: { 'User-Agent': UA, 'Accept': 'text/html' } });
    const html = await res.text();
    const $ = cheerio.load(html);
    const jobs = [];
    $('div[data-id]').each((i, el) => {
      const title = $(el).find('h2 a, h3 a').text().trim();
      const company = $(el).find('.company-name, [data-testid="company-name"]').text().trim();
      const link = $(el).find('h2 a, h3 a').attr('href') || '';
      if (title) jobs.push({ source: 'BuiltIn', title, company, location: 'Remote', url: link.startsWith('http') ? link : `https://builtin.com${link}`, query });
    });
    return jobs;
  } catch (err) { console.error(`  BuiltIn error: ${err.message}`); return []; }
}

// ══════════════════════════════════════════════════════════════════════
// 6. WELLFOUND (formerly AngelList) — HTML scrape
// ══════════════════════════════════════════════════════════════════════

async function searchWellfound() {
  try {
    const res = await fetch('https://wellfound.com/role/marketing/vp-of-marketing', { headers: HEADERS, redirect: 'follow' });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const html = await res.text();
    const $ = cheerio.load(html);
    const jobs = [];
    $('[data-test="StartupResult"], .styles_component__0QhET').each((i, el) => {
      const title = $(el).find('[data-test="JobTitle"], .styles_title__xpQDw').text().trim();
      const company = $(el).find('[data-test="StartupName"], .styles_name__Omaui').text().trim();
      const salary = $(el).find('[data-test="Salary"], .styles_salary__il2fl').text().trim();
      const link = $(el).find('a[href*="/jobs/"]').attr('href') || '';
      if (title) jobs.push({
        source: 'Wellfound', title, company, location: 'Remote',
        url: link.startsWith('http') ? link : link ? `https://wellfound.com${link}` : '',
        salary, query: 'VP Marketing',
      });
    });
    return jobs;
  } catch (err) { console.error(`  Wellfound error: ${err.message}`); return []; }
}

// ══════════════════════════════════════════════════════════════════════
// 7. GLASSDOOR
// ══════════════════════════════════════════════════════════════════════

async function searchGlassdoor(query) {
  try {
    const res = await fetch(`https://www.glassdoor.com/Job/remote-${encodeURIComponent(query.replace(/\s+/g, '-').toLowerCase())}-jobs-SRCH_IL.0,6_IS11047_KO7,${7 + query.length}.htm`, {
      headers: HEADERS,
    });
    const html = await res.text();
    const $ = cheerio.load(html);
    const jobs = [];
    $('li[data-test="jobListing"], .react-job-listing').each((i, el) => {
      const title = $(el).find('[data-test="job-title"], .jobTitle').text().trim();
      const company = $(el).find('.EmployerProfile_compactEmployerName__LE242, .jobHeader').text().trim();
      const location = $(el).find('[data-test="emp-location"], .loc').text().trim();
      const link = $(el).find('a[data-test="job-title"], a.jobTitle').attr('href') || '';
      const salary = $(el).find('[data-test="detailSalary"], .salary-estimate').text().trim();
      if (title) jobs.push({
        source: 'Glassdoor', title, company, location: location || 'Remote',
        url: link.startsWith('http') ? link : link ? `https://www.glassdoor.com${link}` : '',
        salary, query,
      });
    });
    return jobs;
  } catch (err) { console.error(`  Glassdoor error: ${err.message}`); return []; }
}

// ══════════════════════════════════════════════════════════════════════
// 8. ZIPRECRUITER
// ══════════════════════════════════════════════════════════════════════

async function searchZipRecruiter(query) {
  try {
    const res = await fetch(`https://www.ziprecruiter.com/jobs-search?search=${encodeURIComponent(query)}&location=Remote&refine_by_location_type=only_remote`, { headers: HEADERS });
    const html = await res.text();
    const $ = cheerio.load(html);
    const jobs = [];
    $('article.job_result, div.job_result_two_pane').each((i, el) => {
      const title = $(el).find('h2.job_result_title, a.job_link').text().trim();
      const company = $(el).find('a.t_org_link, .job_org').text().trim();
      const location = $(el).find('.job_location, .location').text().trim();
      const link = $(el).find('a.job_link, h2 a').attr('href') || '';
      const salary = $(el).find('.job_salary, .salary_estimate').text().trim();
      if (title) jobs.push({ source: 'ZipRecruiter', title, company, location: location || 'Remote', url: link, salary, query });
    });
    return jobs;
  } catch (err) { console.error(`  ZipRecruiter error: ${err.message}`); return []; }
}

// ══════════════════════════════════════════════════════════════════════
// 9. FLEXJOBS (via RSS/search)
// ══════════════════════════════════════════════════════════════════════

async function searchFlexJobs(query) {
  try {
    const res = await fetch(`https://www.flexjobs.com/search?search=${encodeURIComponent(query)}&tele_level%5B%5D=All+Telecommuting`, { headers: HEADERS });
    const html = await res.text();
    const $ = cheerio.load(html);
    const jobs = [];
    $('li.job-post, div.sc-job-listing').each((i, el) => {
      const title = $(el).find('a.job-link, h5, .job-title').text().trim();
      const company = $(el).find('.employer, .company-name').text().trim();
      const link = $(el).find('a.job-link, a[href*="/job/"]').attr('href') || '';
      if (title) jobs.push({
        source: 'FlexJobs', title, company, location: 'Remote',
        url: link.startsWith('http') ? link : link ? `https://www.flexjobs.com${link}` : '', query,
      });
    });
    return jobs;
  } catch (err) { console.error(`  FlexJobs error: ${err.message}`); return []; }
}

// ══════════════════════════════════════════════════════════════════════
// 10. GREENHOUSE JOB BOARDS (public boards — direct ATS listings)
// ══════════════════════════════════════════════════════════════════════

async function searchGreenhouseBoards() {
  // Known companies with public Greenhouse boards and marketing VP roles
  const boards = [
    // Top-tier tech companies with public Greenhouse boards
    'figma', 'stripe', 'notion', 'datadog', 'hashicorp', 'gitlab',
    'cloudflare', 'airtable', 'dbt-labs', 'snyk', 'grafana-labs',
    'canva', 'miro', 'loom', 'calendly', 'ramp', 'brex', 'plaid',
    'segment', 'twilio', 'hubspot', 'zapier', 'webflow', 'vercel',
    // SaaS / Growth companies
    'amplitude', 'mixpanel', 'intercom', 'drift', 'gong',
    'outreach', '6sense', 'mutinyhq', 'hightouch', 'census',
    'drata', 'vanta', 'ironclad', 'docebo', 'sendbird',
    'launchdarkly', 'split', 'flagsmith', 'contentful', 'storyblok',
    // AI / ML companies
    'anthropic', 'openai', 'cohere', 'jasper', 'copy-ai',
    'runway', 'stability-ai', 'huggingface', 'scale-ai', 'labelbox',
    'weights-and-biases', 'together-ai', 'modal-labs', 'replit',
    // Fintech
    'affirm', 'marqeta', 'mercury', 'gusto', 'rippling',
    'deel', 'remote-com', 'oysterhr', 'justworks',
    // Security / Infra
    'tailscale', 'teleport', 'lacework', 'orca-security',
    'wiz-io', 'semgrep', 'chainguard', 'isovalent',
    // E-commerce / DTC
    'shopify', 'bigcommerce', 'bolt', 'recharge', 'gorgias',
    'stamped', 'yotpo', 'attentive', 'klaviyo', 'postscript',
    // Climate / Energy
    'arcadia', 'palmetto', 'span-io', 'enphase',
  ];
  const allJobs = [];
  for (const board of boards) {
    try {
      const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${board}/jobs`, {
        headers: { 'Accept': 'application/json' },
      });
      if (!res.ok) continue;
      const data = await res.json();
      (data.jobs || []).forEach(j => {
        const title = j.title || '';
        const pos = title.toLowerCase();
        if ((pos.includes('vp') || pos.includes('vice president') || pos.includes('head of') ||
             pos.includes('director') || pos.includes('cmo') || pos.includes('chief marketing')) &&
            (pos.includes('marketing') || pos.includes('growth') || pos.includes('demand'))) {
          const loc = j.location?.name || '';
          allJobs.push({
            source: 'Greenhouse', title, company: board.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
            location: loc, url: j.absolute_url || `https://boards.greenhouse.io/${board}/jobs/${j.id}`,
            datePosted: j.updated_at || '', query: 'VP Marketing',
            external_id: `gh-${board}-${j.id}`,
          });
        }
      });
    } catch {}
    await delay(300); // Rate limit
  }
  return allJobs;
}

// ══════════════════════════════════════════════════════════════════════
// 11. LEVER JOB BOARDS (public boards — direct ATS listings)
// ══════════════════════════════════════════════════════════════════════

async function searchLeverBoards() {
  const boards = [
    'Netflix', 'coinbase', 'atlassian', 'postman',
    'databricks', 'Grammarly', 'carta', 'retool',
    'scale', 'anduril', 'rippling', 'faire',
    // Additional Lever companies
    'nerdwallet', 'chime', 'lattice', 'lucid', 'GOAT-Group',
    'momentive', 'onemedical', 'pagerduty', 'samsara', 'sentry',
    'SmartRecruiters', 'squarespace', 'sweetgreen', 'tempus',
    'thumbtack', 'toast', 'TripActions', 'upstart', 'wealthfront',
    'benchling', 'cockroachlabs', 'confluent', 'coreweave',
    'crossbeam', 'Harness', 'heap', 'JumpCloud', 'LaunchDarkly',
    'Litmus', 'materialize', 'mongodb', 'netlify', 'newrelic',
    'ngrok', 'noom', 'olo', 'pachyderm', 'PlanetScale',
    'Prefect', 'readme', 'sourcegraph', 'Stytch', 'temporal',
    'terraform', 'Weights-Biases', 'WorkOS', 'Zscaler',
  ];
  const allJobs = [];
  for (const board of boards) {
    try {
      const res = await fetch(`https://api.lever.co/v0/postings/${board}?mode=json`, {
        headers: { 'Accept': 'application/json' },
      });
      if (!res.ok) continue;
      const data = await res.json();
      data.forEach(j => {
        const title = j.text || '';
        const pos = title.toLowerCase();
        if ((pos.includes('vp') || pos.includes('vice president') || pos.includes('head of') ||
             pos.includes('director') || pos.includes('cmo') || pos.includes('chief marketing')) &&
            (pos.includes('marketing') || pos.includes('growth') || pos.includes('demand'))) {
          allJobs.push({
            source: 'Lever', title, company: board.replace(/([A-Z])/g, ' $1').trim(),
            location: j.categories?.location || 'Remote',
            url: j.hostedUrl || j.applyUrl || '',
            datePosted: j.createdAt ? new Date(j.createdAt).toISOString() : '',
            query: 'VP Marketing',
            external_id: `lever-${board}-${j.id}`,
            // Lever apply URL for direct API submit
            _applyUrl: j.applyUrl || '',
          });
        }
      });
    } catch {}
    await delay(300);
  }
  return allJobs;
}

// ══════════════════════════════════════════════════════════════════════
// 12. SIMPLYHIRED
// ══════════════════════════════════════════════════════════════════════

async function searchSimplyHired(query) {
  try {
    const res = await fetch(`https://www.simplyhired.com/search?q=${encodeURIComponent(query)}&l=remote&fdb=14`, { headers: HEADERS });
    const html = await res.text();
    const $ = cheerio.load(html);
    const jobs = [];
    $('article[data-jobkey], li.SerpJob').each((i, el) => {
      const title = $(el).find('h2 a, .jobposting-title').text().trim();
      const company = $(el).find('[data-testid="companyName"], .jobposting-company').text().trim();
      const location = $(el).find('[data-testid="searchSerpJobLocation"], .jobposting-location').text().trim();
      const link = $(el).find('h2 a, a[data-mdref]').attr('href') || '';
      const salary = $(el).find('.jobposting-salary, .SerpJob-metaInfoLeft').text().trim();
      if (title) jobs.push({
        source: 'SimplyHired', title, company, location: location || 'Remote',
        url: link.startsWith('http') ? link : link ? `https://www.simplyhired.com${link}` : '',
        salary, query,
      });
    });
    return jobs;
  } catch (err) { console.error(`  SimplyHired error: ${err.message}`); return []; }
}

// ══════════════════════════════════════════════════════════════════════
// 13. THE MUSE
// ══════════════════════════════════════════════════════════════════════

async function searchTheMuse() {
  try {
    const res = await fetch('https://www.themuse.com/api/public/jobs?category=Marketing&level=Senior%20Level&location=Flexible%20/%20Remote&page=1', {
      headers: { 'Accept': 'application/json' },
    });
    const data = await res.json();
    return (data.results || []).filter(j => {
      const pos = (j.name || '').toLowerCase();
      return pos.includes('vp') || pos.includes('vice president') || pos.includes('head of') || pos.includes('director') || pos.includes('cmo');
    }).map(j => ({
      source: 'TheMuse', title: j.name || '', company: j.company?.name || '',
      location: 'Remote', url: j.refs?.landing_page || '',
      datePosted: j.publication_date || '', query: 'VP Marketing',
    }));
  } catch (err) { console.error(`  TheMuse error: ${err.message}`); return []; }
}

// ══════════════════════════════════════════════════════════════════════
// MAIN ORCHESTRATOR
// ══════════════════════════════════════════════════════════════════════

async function searchAllSources(queries = SEARCH_QUERIES) {
  console.log('\n[sources] Searching 13 job boards for VP Marketing remote roles...\n');
  const allJobs = [];
  const seen = new Set();

  function addJobs(jobs) {
    jobs.forEach(job => {
      if (!job.title) return;
      const key = `${job.title.toLowerCase().replace(/[^a-z0-9]/g, '')}-${job.company.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      if (!seen.has(key)) { seen.add(key); allJobs.push(job); }
    });
  }

  // ── Wave 1: API-based sources (fast, most reliable) ──
  console.log('  Wave 1: API sources (RemoteOK, Greenhouse, Lever, TheMuse)');
  const wave1 = await Promise.all([
    searchRemoteOK(),
    searchGreenhouseBoards(),
    searchLeverBoards(),
    searchTheMuse(),
    searchWellfound(),
  ]);
  wave1.forEach(addJobs);
  console.log(`  → Wave 1: ${allJobs.length} jobs`);

  // ── Wave 2: HTML scraping sources (need rate limiting) ──
  console.log('  Wave 2: Scraping LinkedIn, Indeed, Glassdoor, ZipRecruiter, SimplyHired, BuiltIn, FlexJobs, WWR');

  for (const query of queries) {
    console.log(`    Searching: "${query}"`);
    const results = await Promise.all([
      searchLinkedIn(query),
      searchIndeed(query),
      searchGlassdoor(query),
      searchZipRecruiter(query),
      searchSimplyHired(query),
    ]);
    results.forEach(addJobs);
    await delay(2000); // Rate limit between query rounds
  }

  // Single-fetch boards
  const wave2single = await Promise.all([
    searchWWR(),
    searchBuiltIn('VP Marketing'),
    searchBuiltIn('CMO'),
    searchBuiltIn('Head of Marketing'),
    searchFlexJobs('VP Marketing remote'),
    searchFlexJobs('CMO remote'),
  ]);
  wave2single.forEach(addJobs);

  console.log(`\n[sources] Total: ${allJobs.length} unique jobs across 13 sources\n`);
  return allJobs;
}

module.exports = { searchAllSources, SEARCH_QUERIES };
