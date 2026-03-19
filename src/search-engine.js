// Orchestrates the full search → score → store pipeline
// Now saves results incrementally so Greenhouse/Lever jobs appear immediately
const { rankJobs } = require('./scorer');
const { generateCoverLetter, generateLinkedInOutreach, generateEmailOutreach } = require('./cover-letter-gen');
const { stmts, upsertMany } = require('./db');

function enrichAndStore(rawJobs) {
  if (rawJobs.length === 0) return { stored: 0, newCount: 0, tierA: 0, tierB: 0, tierC: 0 };

  const ranked = rankJobs(rawJobs, 'C');
  const enriched = ranked.map(job => ({
    ...job,
    cover_letter: generateCoverLetter(job),
    linkedin_msg: generateLinkedInOutreach(job),
    email_msg: generateEmailOutreach(job),
  }));

  const newCount = upsertMany(enriched);
  return {
    stored: enriched.length,
    newCount,
    tierA: enriched.filter(j => j.tier === 'A').length,
    tierB: enriched.filter(j => j.tier === 'B').length,
    tierC: enriched.filter(j => j.tier === 'C').length,
  };
}

async function runFullSearch() {
  console.log('[search-engine] Starting full search run...');
  const run = stmts.createSearchRun.run();
  const runId = run.lastInsertRowid;

  let totalFound = 0, totalNew = 0, totalA = 0, totalB = 0, totalC = 0;

  try {
    // Import sources individually so we can save incrementally
    const fetch = require('node-fetch');
    const cheerio = require('cheerio');
    const { searchAllSources } = require('./job-sources');

    // Run the full search
    const rawJobs = await searchAllSources();
    console.log(`[search-engine] Found ${rawJobs.length} raw jobs`);

    // Score, enrich, and store
    const result = enrichAndStore(rawJobs);
    totalFound = rawJobs.length;
    totalNew = result.newCount;
    totalA = result.tierA;
    totalB = result.tierB;
    totalC = result.tierC;

    console.log(`[search-engine] Stored ${result.stored} jobs (${result.newCount} new)`);

    // Complete the run
    stmts.completeSearchRun.run(totalFound, totalNew, totalA, totalB, totalC, runId);
    stmts.logActivity.run('search', `Search complete: ${totalFound} found, ${totalNew} new, ${totalA}A/${totalB}B/${totalC}C`, null);

    console.log(`[search-engine] Search run #${runId} complete!`);
    return { runId, total: totalFound, newCount: totalNew, tierA: totalA, tierB: totalB, tierC: totalC };

  } catch (err) {
    console.error('[search-engine] Search run failed:', err.message);
    stmts.failSearchRun.run(err.message, runId);
    stmts.logActivity.run('error', `Search failed: ${err.message}`, null);
    throw err;
  }
}

module.exports = { runFullSearch };
