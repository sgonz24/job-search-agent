#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════
//  Daily Scheduler — runs the job search agent on a cron schedule
//  Usage: node scheduler.js          (runs every day at 8 AM)
//         node scheduler.js --now    (runs once immediately)
// ═══════════════════════════════════════════════════════════════════

const { execSync } = require('child_process');
const path = require('path');

const INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours
const AGENT_PATH = path.join(__dirname, 'agent.js');

function runAgent() {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`Running job search agent at ${new Date().toLocaleString()}`);
  console.log('═'.repeat(60));

  try {
    execSync(`node "${AGENT_PATH}"`, { stdio: 'inherit', cwd: __dirname });
    console.log(`\nNext run: ${new Date(Date.now() + INTERVAL_MS).toLocaleString()}`);
  } catch (err) {
    console.error('Agent run failed:', err.message);
  }
}

if (process.argv.includes('--now')) {
  runAgent();
} else {
  console.log('🕐 Job Search Scheduler started');
  console.log(`   Running every 24 hours`);
  console.log(`   First run: now\n`);
  runAgent();
  setInterval(runAgent, INTERVAL_MS);
}
