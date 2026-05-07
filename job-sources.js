// Job Board Search Sources - builds search URLs for remote VP Marketing roles
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
];

// ── Job board scrapers ──────────────────────────────────────────────

async function searchLinkedInJobs(query, page = 0) {
  const url = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(query)}&location=United%20States&f_WT=2&f_E=5%2C6&start=${page * 25}`;
  // f_WT=2 = remote, f_E=5,6 = Director + Executive level
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    const html = await res.text();
    const $ = cheerio.load(html);
    const jobs = [];

    $('div.base-card').each((i, el) => {
      const title = $(el).find('h3.base-search-card__title').text().trim();
      const company = $(el).find('h4.base-search-card__subtitle').text().trim();
      const location = $(el).find('span.job-search-card__location').text().trim();
      const link = $(el).find('a.base-card__full-link').attr('href') || '';
      const datePosted = $(el).find('time').attr('datetime') || '';

      if (title) {
        jobs.push({
          source: 'LinkedIn',
          title,
          company,
          location,
          url: link.split('?')[0],
          datePosted,
          query,
        });
      }
    });

    return jobs;
  } catch (err) {
    console.error(`  LinkedIn search error for "${query}": ${err.message}`);
    return [];
  }
}

async function searchIndeedJobs(query) {
  const url = `https://www.indeed.com/jobs?q=${encodeURIComponent(query)}&l=Remote&sc=0kf%3Aattr(DSQF7)%3B&fromage=14&sort=date`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });
    const html = await res.text();
    const $ = cheerio.load(html);
    const jobs = [];

    $('div.job_seen_beacon, div.jobsearch-ResultsList div.cardOutline').each((i, el) => {
      const title = $(el).find('h2.jobTitle span[title], h2 a span').text().trim();
      const company = $(el).find('span[data-testid="company-name"], span.companyName').text().trim();
      const location = $(el).find('div[data-testid="text-location"], div.companyLocation').text().trim();
      const jobId = $(el).find('a[data-jk]').attr('data-jk') || '';
      const link = jobId ? `https://www.indeed.com/viewjob?jk=${jobId}` : '';

      if (title) {
        jobs.push({
          source: 'Indeed',
          title,
          company,
          location,
          url: link,
          datePosted: '',
          query,
        });
      }
    });

    return jobs;
  } catch (err) {
    console.error(`  Indeed search error for "${query}": ${err.message}`);
    return [];
  }
}

async function searchBuiltInJobs(query) {
  const url = `https://builtin.com/jobs/remote/marketing/${encodeURIComponent(query.replace(/\s+/g, '-').toLowerCase())}?search=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(`https://builtin.com/jobs/remote?search=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html',
      },
    });
    const html = await res.text();
    const $ = cheerio.load(html);
    const jobs = [];

    $('div[data-id]').each((i, el) => {
      const title = $(el).find('h2 a, h3 a').text().trim();
      const company = $(el).find('.company-name, [data-testid="company-name"]').text().trim();
      const link = $(el).find('h2 a, h3 a').attr('href') || '';

      if (title) {
        jobs.push({
          source: 'BuiltIn',
          title,
          company,
          location: 'Remote',
          url: link.startsWith('http') ? link : `https://builtin.com${link}`,
          datePosted: '',
          query,
        });
      }
    });

    return jobs;
  } catch (err) {
    console.error(`  BuiltIn search error: ${err.message}`);
    return [];
  }
}

async function searchRemoteOkJobs(query) {
  const url = `https://remoteok.com/remote-${encodeURIComponent(query.replace(/\s+/g, '-').toLowerCase())}-jobs`;
  try {
    const res = await fetch('https://remoteok.com/api', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        'Accept': 'application/json',
      },
    });
    const data = await res.json();
    const jobs = [];
    const q = query.toLowerCase();

    data.forEach(job => {
      if (!job.position) return;
      const pos = job.position.toLowerCase();
      const tags = (job.tags || []).join(' ').toLowerCase();
      if (
        (pos.includes('vp') || pos.includes('vice president') || pos.includes('head of') || pos.includes('cmo') || pos.includes('director')) &&
        (pos.includes('marketing') || tags.includes('marketing'))
      ) {
        jobs.push({
          source: 'RemoteOK',
          title: job.position,
          company: job.company || '',
          location: 'Remote',
          url: job.url ? `https://remoteok.com${job.url}` : '',
          datePosted: job.date || '',
          salary: job.salary_min ? `$${job.salary_min}-$${job.salary_max}` : '',
          query,
        });
      }
    });

    return jobs;
  } catch (err) {
    console.error(`  RemoteOK search error: ${err.message}`);
    return [];
  }
}

async function searchWeWorkRemotely(query) {
  try {
    const res = await fetch('https://weworkremotely.com/categories/remote-marketing-jobs', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        'Accept': 'text/html',
      },
    });
    const html = await res.text();
    const $ = cheerio.load(html);
    const jobs = [];

    $('li.feature, li:not(.ad)').each((i, el) => {
      const title = $(el).find('span.title').text().trim();
      const company = $(el).find('span.company').text().trim();
      const link = $(el).find('a[href*="/remote-jobs/"]').last().attr('href') || '';

      if (title) {
        const pos = title.toLowerCase();
        if (pos.includes('vp') || pos.includes('vice president') || pos.includes('head of') ||
            pos.includes('director') || pos.includes('cmo') || pos.includes('chief marketing')) {
          jobs.push({
            source: 'WeWorkRemotely',
            title,
            company,
            location: 'Remote',
            url: link.startsWith('http') ? link : `https://weworkremotely.com${link}`,
            datePosted: '',
            query: 'marketing leadership',
          });
        }
      }
    });

    return jobs;
  } catch (err) {
    console.error(`  WWR search error: ${err.message}`);
    return [];
  }
}

// ── Main search orchestrator ────────────────────────────────────────

async function searchAllSources(queries = SEARCH_QUERIES) {
  console.log('\n🔍 Searching job boards for VP Marketing remote roles...\n');
  const allJobs = [];
  const seen = new Set();

  // Run searches in parallel batches
  for (const query of queries) {
    console.log(`  Searching: "${query}"`);
    const results = await Promise.all([
      searchLinkedInJobs(query),
      searchIndeedJobs(query),
      searchRemoteOkJobs(query),
    ]);

    results.flat().forEach(job => {
      const key = `${job.title.toLowerCase()}-${job.company.toLowerCase()}`;
      if (!seen.has(key) && job.title) {
        seen.add(key);
        allJobs.push(job);
      }
    });

    // Be respectful with rate limiting
    await new Promise(r => setTimeout(r, 1500));
  }

  // Also search these (no query needed, they aggregate)
  console.log('  Searching: WeWorkRemotely & BuiltIn...');
  const [wwrJobs, builtinJobs] = await Promise.all([
    searchWeWorkRemotely(),
    searchBuiltInJobs('VP Marketing'),
  ]);

  [...wwrJobs, ...builtinJobs].forEach(job => {
    const key = `${job.title.toLowerCase()}-${job.company.toLowerCase()}`;
    if (!seen.has(key) && job.title) {
      seen.add(key);
      allJobs.push(job);
    }
  });

  console.log(`\n✅ Found ${allJobs.length} unique jobs across all sources\n`);
  return allJobs;
}

module.exports = { searchAllSources, SEARCH_QUERIES };
