// Generates tailored cover letters and outreach messages using Sonny's profile
const PROFILE = require('./resume-profile');

function generateCoverLetter(job) {
  const { title, company, matchReasons = [], fitScore } = job;

  // Pick relevant highlights based on job keywords
  const text = `${title} ${company} ${job.description || ''}`.toLowerCase();
  const highlights = [];

  if (text.includes('ai') || text.includes('automation') || text.includes('technology')) {
    highlights.push(
      "I operate 10+ autonomous AI systems running 24/7 on dedicated infrastructure — these aren't experiments, they're production systems delivering real ROI for clients across solar energy, wildfire defense tech, and luxury hospitality."
    );
    highlights.push(
      "My AI skills are in the top 1%. I build production agent workflows using Claude, GPT, and Gemini for content creation, lead generation, outreach automation, and performance reporting."
    );
  }

  if (text.includes('growth') || text.includes('gtm') || text.includes('go-to-market') || text.includes('b2b')) {
    highlights.push(
      "I specialize in taking companies from zero marketing foundation to fully operational growth engines. At Ember Pro USA, I built the entire GTM strategy from scratch — target segments, positioning, channel mix, martech stack, and AI-powered content pipelines."
    );
  }

  if (text.includes('p&l') || text.includes('budget') || text.includes('revenue') || text.includes('scale')) {
    highlights.push(
      "At Welk Resort Group, I managed a $60M P&L budget while consistently decreasing costs and increasing revenue across 6 marketing programs. I led 2019's most profitable program at under 3% cost of marketing."
    );
  }

  if (text.includes('team') || text.includes('leadership') || text.includes('mentor')) {
    highlights.push(
      "I've led and mentored teams of 50+ people across marketing and sales functions, building cultures of innovation and accountability."
    );
  }

  if (text.includes('sales') || text.includes('pipeline') || text.includes('demand gen')) {
    highlights.push(
      "At Eevelle, I increased sales volume by 300% year over year through targeted campaigns and process improvements. I know how to build pipeline that converts."
    );
  }

  // Default highlights if nothing specific matched
  if (highlights.length === 0) {
    highlights.push(
      "I combine executive marketing strategy with hands-on AI technical execution — I'm not the CMO who hands off to an agency, I'm the one who builds the systems, launches the campaigns, and shows you the dashboard."
    );
    highlights.push(
      "With 10+ years driving growth across B2B and B2C markets, I've managed up to $60M in P&L, led teams of 50+, and delivered 300% YOY sales growth."
    );
  }

  const letter = `Dear ${company} Hiring Team,

I'm writing to express my strong interest in the ${title} position at ${company}. As an AI marketing leader who combines strategic executive leadership with hands-on technical execution, I believe I bring a unique combination of skills that's increasingly rare and increasingly valuable.

${highlights.join('\n\n')}

My approach is strategy backed by systems, not slide decks. Every engagement I take on results in working infrastructure, live campaigns, and documented processes your team can own. I'm not looking to add another layer of management — I'm looking to build your marketing engine and make it run.

I'd love to discuss how my combination of marketing leadership and AI expertise can drive growth at ${company}. I'm available for a conversation at your convenience.

Best regards,
Sonny R. Gonzalez
${PROFILE.email} | ${PROFILE.phone}
${PROFILE.website}`;

  return letter;
}

function generateLinkedInOutreach(job, hiringManagerName = null) {
  const name = hiringManagerName || 'there';
  const text = `${job.title} ${job.company} ${job.description || ''}`.toLowerCase();

  let hook = '';
  if (text.includes('ai') || text.includes('automation')) {
    hook = `I noticed ${job.company} is looking for marketing leadership with AI chops — that's literally what I do. I run 10+ production AI systems 24/7 and combine that with executive marketing strategy.`;
  } else if (text.includes('growth') || text.includes('gtm')) {
    hook = `I saw the ${job.title} opening at ${job.company} and got excited. I specialize in building growth engines from zero — GTM strategy, martech implementation, campaign execution, all backed by AI automation.`;
  } else {
    hook = `I came across the ${job.title} role at ${job.company} and my background is a strong match. I'm a marketing executive who also builds production AI systems — strategy backed by systems, not slide decks.`;
  }

  return `Hi ${name},

${hook}

Quick highlights: $60M P&L management, 300% YOY sales growth, currently serving as Fractional CMO for companies in solar, defense tech, and hospitality while operating AI automation infrastructure.

Would love to chat if you're open to it. Happy to share specifics on what I could bring to ${job.company}.

Sonny Gonzalez
${PROFILE.website}`;
}

function generateEmailOutreach(job, contactName = null) {
  const name = contactName || 'Hiring Manager';

  return `Subject: ${job.title} at ${job.company} — AI Marketing Leader with $60M P&L Experience

Hi ${name},

I'm reaching out about the ${job.title} position at ${job.company}. I'm a marketing executive who builds production AI systems — not just someone who "uses ChatGPT," but someone who operates 10+ autonomous AI agents on dedicated hardware, serving clients across multiple industries.

Three things that set me apart:

1. AI in the top 1%: I build and deploy production automation systems for content, lead gen, outreach, and reporting. These run 24/7 without human intervention.

2. Proven executive track record: $60M P&L management at Welk Resort Group, 300% sales growth at Eevelle, and currently serving as Fractional CMO for multiple companies.

3. Builder, not a talker: Every engagement results in working infrastructure, live campaigns, and documented processes. I implement complete martech stacks from scratch.

I'd welcome a conversation about how I can drive growth at ${job.company}. Available anytime.

Best,
Sonny R. Gonzalez
${PROFILE.email} | ${PROFILE.phone}
${PROFILE.website}`;
}

module.exports = { generateCoverLetter, generateLinkedInOutreach, generateEmailOutreach };
