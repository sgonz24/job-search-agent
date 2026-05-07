// Generates beautiful HTML and markdown reports of job search results
const fs = require('fs');
const path = require('path');
const PROFILE = require('./resume-profile');
const { generateCoverLetter, generateLinkedInOutreach, generateEmailOutreach } = require('./cover-letter-gen');

function generateHTMLReport(rankedJobs, timestamp) {
  const tierA = rankedJobs.filter(j => j.tier === 'A');
  const tierB = rankedJobs.filter(j => j.tier === 'B');
  const tierC = rankedJobs.filter(j => j.tier === 'C');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Job Search Report — ${PROFILE.name} — ${timestamp}</title>
  <style>
    :root {
      --blue: #184173;
      --light-blue: #3170B3;
      --orange: #EF8B22;
      --bg: #f8f9fa;
      --card: #ffffff;
      --text: #1a1a1a;
      --muted: #6b7280;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: var(--bg); color: var(--text); line-height: 1.6; }
    .container { max-width: 1100px; margin: 0 auto; padding: 2rem; }
    header { background: linear-gradient(135deg, var(--blue), var(--light-blue)); color: white; padding: 2.5rem; border-radius: 12px; margin-bottom: 2rem; }
    header h1 { font-size: 1.8rem; margin-bottom: 0.5rem; }
    header p { opacity: 0.9; font-size: 0.95rem; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
    .stat-card { background: var(--card); padding: 1.5rem; border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); text-align: center; }
    .stat-card .number { font-size: 2rem; font-weight: 700; color: var(--blue); }
    .stat-card .label { color: var(--muted); font-size: 0.85rem; margin-top: 0.25rem; }
    .tier-section { margin-bottom: 2rem; }
    .tier-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; }
    .tier-badge { display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 50%; font-weight: 700; font-size: 1.1rem; color: white; }
    .tier-A { background: var(--orange); }
    .tier-B { background: var(--light-blue); }
    .tier-C { background: var(--muted); }
    .tier-header h2 { font-size: 1.3rem; }
    .job-card { background: var(--card); border-radius: 10px; padding: 1.5rem; margin-bottom: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); border-left: 4px solid var(--blue); transition: transform 0.15s; }
    .job-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.12); }
    .job-card.tier-A-card { border-left-color: var(--orange); }
    .job-card.tier-B-card { border-left-color: var(--light-blue); }
    .job-title { font-size: 1.15rem; font-weight: 600; color: var(--blue); }
    .job-title a { color: inherit; text-decoration: none; }
    .job-title a:hover { text-decoration: underline; }
    .job-meta { display: flex; flex-wrap: wrap; gap: 1rem; margin: 0.5rem 0; color: var(--muted); font-size: 0.9rem; }
    .score-bar { height: 6px; background: #e5e7eb; border-radius: 3px; margin: 0.75rem 0; overflow: hidden; }
    .score-fill { height: 100%; border-radius: 3px; }
    .score-high { background: var(--orange); }
    .score-med { background: var(--light-blue); }
    .score-low { background: var(--muted); }
    .match-reasons { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem; }
    .reason-tag { background: #eef2ff; color: var(--blue); padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.8rem; }
    .actions { margin-top: 1rem; display: flex; gap: 0.75rem; flex-wrap: wrap; }
    .btn { display: inline-block; padding: 0.5rem 1rem; border-radius: 6px; font-size: 0.85rem; font-weight: 500; text-decoration: none; cursor: pointer; border: none; }
    .btn-primary { background: var(--blue); color: white; }
    .btn-outline { background: transparent; border: 1.5px solid var(--blue); color: var(--blue); }
    .btn:hover { opacity: 0.85; }
    details { margin-top: 0.75rem; }
    details summary { cursor: pointer; color: var(--light-blue); font-size: 0.9rem; font-weight: 500; }
    details pre { background: #f1f5f9; padding: 1rem; border-radius: 8px; margin-top: 0.5rem; white-space: pre-wrap; font-size: 0.85rem; line-height: 1.5; max-height: 300px; overflow-y: auto; }
    footer { text-align: center; color: var(--muted); font-size: 0.85rem; padding: 2rem 0; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>VP of Marketing — Job Search Report</h1>
      <p>${PROFILE.name} | ${timestamp} | Remote positions only</p>
    </header>

    <div class="stats">
      <div class="stat-card">
        <div class="number">${rankedJobs.length}</div>
        <div class="label">Total Jobs Found</div>
      </div>
      <div class="stat-card">
        <div class="number" style="color: var(--orange)">${tierA.length}</div>
        <div class="label">Tier A (Best Fit)</div>
      </div>
      <div class="stat-card">
        <div class="number" style="color: var(--light-blue)">${tierB.length}</div>
        <div class="label">Tier B (Good Fit)</div>
      </div>
      <div class="stat-card">
        <div class="number">${tierC.length}</div>
        <div class="label">Tier C (Possible)</div>
      </div>
    </div>

    ${tierA.length > 0 ? `
    <div class="tier-section">
      <div class="tier-header">
        <div class="tier-badge tier-A">A</div>
        <h2>Best Fit — Apply Immediately</h2>
      </div>
      ${tierA.map(job => renderJobCard(job, 'A')).join('\n')}
    </div>` : ''}

    ${tierB.length > 0 ? `
    <div class="tier-section">
      <div class="tier-header">
        <div class="tier-badge tier-B">B</div>
        <h2>Good Fit — Worth Pursuing</h2>
      </div>
      ${tierB.map(job => renderJobCard(job, 'B')).join('\n')}
    </div>` : ''}

    ${tierC.length > 0 ? `
    <div class="tier-section">
      <div class="tier-header">
        <div class="tier-badge tier-C">C</div>
        <h2>Possible Fit — Review Manually</h2>
      </div>
      ${tierC.map(job => renderJobCard(job, 'C')).join('\n')}
    </div>` : ''}

    <footer>
      <p>Generated by Sonny's AI Job Search Agent | ${timestamp}</p>
      <p>Powered by Claude Code + Node.js</p>
    </footer>
  </div>
</body>
</html>`;

  return html;
}

function renderJobCard(job, tier) {
  const scoreClass = tier === 'A' ? 'score-high' : tier === 'B' ? 'score-med' : 'score-low';
  const cardClass = tier === 'A' ? 'tier-A-card' : tier === 'B' ? 'tier-B-card' : '';
  const coverLetter = generateCoverLetter(job);
  const linkedInMsg = generateLinkedInOutreach(job);
  const emailMsg = generateEmailOutreach(job);

  return `
    <div class="job-card ${cardClass}">
      <div class="job-title">${job.url ? `<a href="${job.url}" target="_blank">${escapeHtml(job.title)}</a>` : escapeHtml(job.title)}</div>
      <div class="job-meta">
        <span><strong>${escapeHtml(job.company)}</strong></span>
        <span>${escapeHtml(job.location)}</span>
        <span>${job.source}</span>
        ${job.salary ? `<span style="color: var(--orange); font-weight: 600">${job.salary}</span>` : ''}
        ${job.datePosted ? `<span>${job.datePosted}</span>` : ''}
      </div>
      <div class="score-bar"><div class="score-fill ${scoreClass}" style="width: ${job.fitScore}%"></div></div>
      <div style="font-size: 0.85rem; color: var(--muted)">Fit Score: ${job.fitScore}/100</div>
      ${job.matchReasons.length > 0 ? `
      <div class="match-reasons">
        ${job.matchReasons.map(r => `<span class="reason-tag">${escapeHtml(r)}</span>`).join('')}
      </div>` : ''}
      <div class="actions">
        ${job.url ? `<a href="${job.url}" target="_blank" class="btn btn-primary">View Job →</a>` : ''}
      </div>
      <details>
        <summary>📧 Generated Cover Letter</summary>
        <pre>${escapeHtml(coverLetter)}</pre>
      </details>
      <details>
        <summary>💬 LinkedIn Outreach Message</summary>
        <pre>${escapeHtml(linkedInMsg)}</pre>
      </details>
      <details>
        <summary>✉️ Email Outreach</summary>
        <pre>${escapeHtml(emailMsg)}</pre>
      </details>
    </div>`;
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function generateMarkdownReport(rankedJobs, timestamp) {
  const tierA = rankedJobs.filter(j => j.tier === 'A');
  const tierB = rankedJobs.filter(j => j.tier === 'B');
  const tierC = rankedJobs.filter(j => j.tier === 'C');

  let md = `# VP of Marketing — Job Search Report
**${PROFILE.name}** | ${timestamp} | Remote Only

---

## Summary
- **Total Jobs Found:** ${rankedJobs.length}
- **Tier A (Best Fit):** ${tierA.length}
- **Tier B (Good Fit):** ${tierB.length}
- **Tier C (Possible):** ${tierC.length}

---

`;

  if (tierA.length > 0) {
    md += `## 🟠 Tier A — Apply Immediately\n\n`;
    tierA.forEach((job, i) => {
      md += formatJobMarkdown(job, i + 1);
    });
  }

  if (tierB.length > 0) {
    md += `## 🔵 Tier B — Worth Pursuing\n\n`;
    tierB.forEach((job, i) => {
      md += formatJobMarkdown(job, i + 1);
    });
  }

  if (tierC.length > 0) {
    md += `## ⚪ Tier C — Review Manually\n\n`;
    tierC.forEach((job, i) => {
      md += formatJobMarkdown(job, i + 1);
    });
  }

  md += `\n---\n*Generated by Sonny's AI Job Search Agent | ${timestamp}*\n`;
  return md;
}

function formatJobMarkdown(job, num) {
  let md = `### ${num}. ${job.title}\n`;
  md += `**${job.company}** | ${job.location} | ${job.source} | Score: ${job.fitScore}/100\n`;
  if (job.salary) md += `**Salary:** ${job.salary}\n`;
  if (job.url) md += `**Link:** ${job.url}\n`;
  if (job.matchReasons.length > 0) {
    md += `**Match:** ${job.matchReasons.join(' | ')}\n`;
  }
  md += `\n`;
  return md;
}

function generateCSV(rankedJobs) {
  const headers = ['Tier', 'Score', 'Title', 'Company', 'Location', 'Source', 'Salary', 'URL', 'Date Posted', 'Match Reasons'];
  const rows = rankedJobs.map(job => [
    job.tier,
    job.fitScore,
    `"${job.title}"`,
    `"${job.company}"`,
    `"${job.location}"`,
    job.source,
    job.salary || '',
    job.url,
    job.datePosted || '',
    `"${job.matchReasons.join('; ')}"`,
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

function saveReports(rankedJobs) {
  const timestamp = new Date().toISOString().split('T')[0];
  const outputDir = path.join(__dirname, 'output');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const htmlPath = path.join(outputDir, `job-report-${timestamp}.html`);
  const mdPath = path.join(outputDir, `job-report-${timestamp}.md`);
  const csvPath = path.join(outputDir, `job-report-${timestamp}.csv`);
  const jsonPath = path.join(outputDir, `job-report-${timestamp}.json`);

  fs.writeFileSync(htmlPath, generateHTMLReport(rankedJobs, timestamp));
  fs.writeFileSync(mdPath, generateMarkdownReport(rankedJobs, timestamp));
  fs.writeFileSync(csvPath, generateCSV(rankedJobs));
  fs.writeFileSync(jsonPath, JSON.stringify(rankedJobs, null, 2));

  console.log(`\n📊 Reports saved to output/:`);
  console.log(`   HTML: ${htmlPath}`);
  console.log(`   Markdown: ${mdPath}`);
  console.log(`   CSV: ${csvPath}`);
  console.log(`   JSON: ${jsonPath}`);

  return { htmlPath, mdPath, csvPath, jsonPath };
}

module.exports = { generateHTMLReport, generateMarkdownReport, generateCSV, saveReports };
