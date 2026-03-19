// Orchestrates the full search → score → store pipeline
const { searchAllSources } = require('./job-sources');
const { rankJobs } = require('./scorer');
const { generateCoverLetter, generateLinkedInOutreach, generateEmailOutreach } = require('./cover-letter-gen');
const { stmts, upsertMany } = require('./db');

async function runFullSearch() {
  console.log('[search-engine] Starting full search run...');

  // Create a search run record
  const run = stmts.createSearchRun.run();
  const runId = run.lastInsertRowid;

  try {
    // Step 1: Scrape all sources
    const rawJobs = await searchAllSources();
    console.log(`[search-engine] Found ${rawJobs.length} raw jobs`);

    // Step 2: Score and rank
    const rankedJobs = rankJobs(rawJobs, 'C');
    console.log(`[search-engine] ${rankedJobs.length} jobs passed scoring threshold`);

    // Step 3: Generate outreach for each job
    const enrichedJobs = rankedJobs.map(job => ({
      ...job,
      cover_letter: generateCoverLetter(job),
      linkedin_msg: generateLinkedInOutreach(job),
      email_msg: generateEmailOutreach(job),
    }));

    // Step 4: Store in database
    const newCount = upsertMany(enrichedJobs);
    console.log(`[search-engine] Stored ${enrichedJobs.length} jobs (${newCount} new)`);

    // Step 5: Get tier counts
    const tierA = enrichedJobs.filter(j => j.tier === 'A').length;
    const tierB = enrichedJobs.filter(j => j.tier === 'B').length;
    const tierC = enrichedJobs.filter(j => j.tier === 'C').length;

    // Complete the search run
    stmts.completeSearchRun.run(rawJobs.length, newCount, tierA, tierB, tierC, runId);

    // Log activity
    stmts.logActivity.run('search', `Search complete: ${rawJobs.length} found, ${newCount} new, ${tierA}A/${tierB}B/${tierC}C`, null);

    console.log(`[search-engine] Search run #${runId} complete!`);
    return { runId, total: rawJobs.length, newCount, tierA, tierB, tierC };

  } catch (err) {
    console.error('[search-engine] Search run failed:', err.message);
    stmts.failSearchRun.run(err.message, runId);
    stmts.logActivity.run('error', `Search failed: ${err.message}`, null);
    throw err;
  }
}

module.exports = { runFullSearch };
