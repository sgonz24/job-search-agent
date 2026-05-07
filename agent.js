#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════
//  Sonny's AI Job Search Agent
//  Automates VP of Marketing job search across multiple boards
//  Scores, ranks, and generates personalized outreach for each role
// ═══════════════════════════════════════════════════════════════════

const { searchAllSources } = require('./job-sources');
const { rankJobs } = require('./scorer');
const { saveReports } = require('./report-generator');
const PROFILE = require('./resume-profile');

const BANNER = `
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🔍  SONNY'S AI JOB SEARCH AGENT                           ║
║                                                               ║
║   Target: VP of Marketing (Remote)                            ║
║   Candidate: ${PROFILE.name.padEnd(40)}    ║
║   AI Skills: Top 1%                                          ║
║                                                               ║
║   Searching: LinkedIn · Indeed · RemoteOK                     ║
║              WeWorkRemotely · BuiltIn                         ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`;

async function run() {
  console.log(BANNER);
  console.log(`Started: ${new Date().toLocaleString()}\n`);

  // Step 1: Search all job boards
  console.log('━━━ STEP 1: Searching Job Boards ━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const allJobs = await searchAllSources();

  if (allJobs.length === 0) {
    console.log('\n⚠️  No jobs found. This can happen if job boards are blocking scraping.');
    console.log('   Try again later, or check the manual search URLs below:\n');
    printManualSearchUrls();
    return;
  }

  // Step 2: Score and rank against profile
  console.log('━━━ STEP 2: Scoring & Ranking Against Your Profile ━━━━━━━━');
  const rankedJobs = rankJobs(allJobs, 'C');
  console.log(`\n📊 Scored ${allJobs.length} jobs → ${rankedJobs.length} passed minimum fit threshold\n`);

  const tierA = rankedJobs.filter(j => j.tier === 'A');
  const tierB = rankedJobs.filter(j => j.tier === 'B');
  const tierC = rankedJobs.filter(j => j.tier === 'C');

  console.log(`   🟠 Tier A (Best Fit):    ${tierA.length} jobs`);
  console.log(`   🔵 Tier B (Good Fit):    ${tierB.length} jobs`);
  console.log(`   ⚪ Tier C (Possible):    ${tierC.length} jobs`);

  // Step 3: Print top results
  console.log('\n━━━ STEP 3: Top Opportunities ━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const topJobs = rankedJobs.slice(0, 15);
  topJobs.forEach((job, i) => {
    const tierEmoji = job.tier === 'A' ? '🟠' : job.tier === 'B' ? '🔵' : '⚪';
    console.log(`\n  ${tierEmoji} #${i + 1} [${job.tier}] ${job.title}`);
    console.log(`     ${job.company} | ${job.location} | ${job.source}`);
    console.log(`     Score: ${job.fitScore}/100${job.salary ? ` | ${job.salary}` : ''}`);
    if (job.matchReasons.length > 0) {
      console.log(`     Match: ${job.matchReasons.join(' · ')}`);
    }
    if (job.url) console.log(`     URL: ${job.url}`);
  });

  // Step 4: Generate reports
  console.log('\n━━━ STEP 4: Generating Reports ━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const paths = saveReports(rankedJobs);

  // Step 5: Summary
  console.log('\n━━━ COMPLETE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`\n✅ Job search complete!`);
  console.log(`   ${rankedJobs.length} matching jobs found and ranked`);
  console.log(`   ${tierA.length} Tier A jobs ready for immediate application`);
  console.log(`   Cover letters, LinkedIn messages, and email outreach generated`);
  console.log(`\n📂 Open the HTML report for the full interactive experience:`);
  console.log(`   open "${paths.htmlPath}"\n`);

  // Also print manual search URLs for boards we couldn't scrape
  printManualSearchUrls();
}

function printManualSearchUrls() {
  console.log('\n📌 Bookmark these manual search URLs (always up to date):\n');
  const urls = [
    { name: 'LinkedIn', url: 'https://www.linkedin.com/jobs/search/?keywords=VP%20of%20Marketing&f_WT=2&f_E=5%2C6&sortBy=DD' },
    { name: 'Indeed', url: 'https://www.indeed.com/jobs?q=%22VP+of+Marketing%22&l=Remote&fromage=14&sort=date' },
    { name: 'Glassdoor', url: 'https://www.glassdoor.com/Job/remote-vp-of-marketing-jobs-SRCH_IL.0,6_IS11047_KO7,22.htm' },
    { name: 'BuiltIn', url: 'https://builtin.com/jobs/remote?search=VP+of+Marketing' },
    { name: 'WeWorkRemotely', url: 'https://weworkremotely.com/remote-jobs/search?term=vp+marketing' },
    { name: 'RemoteOK', url: 'https://remoteok.com/remote-marketing-jobs' },
    { name: 'Wellfound (AngelList)', url: 'https://wellfound.com/role/l/vp-marketing/remote' },
    { name: 'Otta', url: 'https://otta.com/' },
    { name: 'Levels.fyi', url: 'https://www.levels.fyi/jobs?searchText=VP%20of%20Marketing&jobType=FULLTIME' },
  ];
  urls.forEach(u => console.log(`   ${u.name.padEnd(20)} ${u.url}`));
}

// Run the agent
run().catch(err => {
  console.error('\n❌ Agent error:', err.message);
  console.error(err.stack);
  process.exit(1);
});
