# Job Search Agent → JobHQ Redesign

**Date:** 2026-03-31
**Status:** Draft
**Project:** /Users/sonnygonzalezsolartech/job-search-app/frontend

## Overview

Transform the Job Search Agent from a developer-style Kanban dashboard into a polished, modern SaaS-style **3-panel command center** with an icon sidebar, full-width pipeline table, trending industry feed, and contextual intelligence panel.

Built for Sonny first, designed for open-source sharing later. Power-user UX that's intuitive enough for anyone cloning the repo.

## Architecture

### Layout Structure

```
┌──────┬────────────┬──────────────────────┬─────────────┐
│      │            │                      │             │
│  SB  │  Trending  │     Pipeline         │  Context    │
│  64px│   260px    │     (flex)           │   300px     │
│      │            │                      │             │
│ Icon │  X/AI feed │  Stats strip         │ AI Insights │
│ nav  │  News tab  │  Filter chips        │ Interview Q │
│      │  HN tab    │  Sortable table      │ Quick Links │
│      │            │                      │ Activity    │
│      │ collapsible│  Click row → drawer  │             │
└──────┴────────────┴──────────────────────┴─────────────┘
```

### Sidebar Navigation (64px icon rail)

6 sections, each renders its own view in the main area:

| Icon | Section | Description |
|------|---------|-------------|
| Grid | **Pipeline** | Default view. Full-width job table (replaces card grid). |
| Columns | **Board** | Existing 3-column Kanban (Tier A/B/C). Preserved as-is. |
| Document | **Resume** | Upload, preview, track which version sent to which company. |
| Clock | **Interview Prep** | Full-page question bank by company/category. Red badge for new questions. |
| Link | **Links & Portfolio** | Manage web presence: resume PDF, portfolio URL, LinkedIn, GitHub, personal site. |
| Gear | **Settings** | Configure scan sources, auto-apply preferences, API keys. |

Bottom of sidebar: user avatar (initials "SG").

Sidebar is icon-only (no text labels) — labels appear on hover as tooltips. This keeps the sidebar at 64px and gives maximum content space.

### Pipeline View (Center Panel — Default)

Replaces the current 3-column card board as the default view.

**Stats Strip** — horizontal row of clickable stat cells:
- Total, Tier A, Tier B, Tier C, Applied, Interviews, Offers
- Clicking a stat filters the table to that subset
- Active stat has a gold bottom border indicator

**Filter Bar** — row of chip buttons:
- Source filters: All, LinkedIn, Greenhouse, Lever
- Status filters: New, Saved, Applied, Interviews
- Divider between groups
- Search input on the right (with ⌘K hint)

**Job Table** — full-width sortable rows:
- Columns: Position (title + subtitle), Company, Score (bar + number), Status (pill with dot)
- Two-line rows: title on first line, subtitle (department/location) on second
- Score shown as a mini progress bar + numeric value
- Status pills: green (Applied), gold (New), cyan (Interview)
- Click row → existing detail drawer slides in from right
- Selected row highlighted with gold left border
- Sticky header row

### Trending Feed (Left Panel — 260px)

Live industry pulse while job hunting. Collapsible to give pipeline more space.

**Header:** "Trending" label with a green live-pulse dot.

**Tabs:**
- **𝕏 / AI** — Curated X/Twitter posts filtered for AI, Claude Code, marketing leadership, job market trends
- **News** — TechCrunch, The Verge, etc. — headlines relevant to user's target industry
- **HN** — HackerNews threads about AI, hiring, marketing tech

**Tweet Card Layout:**
- Avatar (color gradient), name, handle, timestamp
- Body text (key terms bolded)
- Category tags (AI, Claude, Career, MarTech) with color-coded pills
- Engagement counts (comments, retweets, likes)

**News Card Layout:**
- Source label (orange, uppercase)
- Headline
- Meta (time ago, read time)

**Data Source:** Initially static/mock data. Future: RSS feeds, X API, or a lightweight scraper microservice. The frontend renders whatever the backend provides at `GET /api/trending`.

**Collapse Behavior:** Click a toggle arrow in the header → panel collapses to 0px, pipeline takes full width. State persisted in localStorage.

### Context Intelligence Panel (Right Panel — 300px)

Always-visible contextual sidebar with 4 sections:

**1. AI Insights**
- "Today's Tip" — proactive advice based on pipeline state (e.g., "You've applied to 44 roles — consider pausing Tier C")
- "Pattern Detected" — data observations (e.g., "Director + Product Marketing scores 15% higher")
- Data source: `GET /api/insights` — backend analyzes job data and returns 1-2 cards
- Initially can be static tips, upgraded to dynamic later

**2. Interview Prep**
- 2-3 rotating questions relevant to the user's target roles
- Each question has a category tag (Behavioral — GTM, Strategic — Measurement, etc.)
- Purple left-border accent
- Data source: `GET /api/interview-prep` — can start as a static JSON file of questions

**3. Quick Access**
- Resume link (filename shown)
- Portfolio link (URL shown)
- LinkedIn link
- GitHub link
- Each item: icon + title + subtitle
- Data source: `GET /api/profile/links` or local config

**4. Recent Activity**
- Compact list: colored dot + message + time
- Shows last 4-5 activities
- Reuses existing `GET /api/activity` endpoint

### Detail Drawer (Preserved)

The existing right-side drawer that slides in when clicking a job row is **preserved as-is** with its current functionality:
- Job title, company, score
- Metadata (location, source, apply method, salary, posted date)
- Action buttons (View Posting, Auto-Apply, Manual Apply)
- Match reasons tags
- Pipeline status buttons
- Outreach tabs (Cover Letter, LinkedIn, Email) with copy button

When the drawer opens, it overlays the context panel (not pushes it).

### Auto-Apply Panel (Preserved)

The existing auto-apply panel is preserved. It opens as a dropdown/overlay from the "Auto-Apply" button in the top bar, same as current behavior.

### Board View (Sidebar Section)

The existing 3-column Kanban board (Tier A/B/C) is preserved and accessible via the Board icon in the sidebar. It renders in the center panel area, replacing the pipeline table. The trending feed and context panel remain visible.

## Component Structure

```
App.jsx (layout shell + routing)
├── Sidebar.jsx (icon nav + active state)
├── Topbar.jsx (title, search, scan/auto-apply buttons)
├── TrendingPanel.jsx (collapsible left panel)
│   ├── TweetCard.jsx
│   └── NewsCard.jsx
├── PipelineView.jsx (default center view)
│   ├── StatsStrip.jsx (clickable stat cells)
│   ├── FilterBar.jsx (chip filters)
│   └── JobTable.jsx (sortable rows)
├── BoardView.jsx (existing Kanban, moved here)
├── ResumeView.jsx (future — upload/preview)
├── InterviewPrepView.jsx (future — full question bank)
├── LinksView.jsx (future — manage web presence)
├── ContextPanel.jsx (right panel)
│   ├── InsightsSection.jsx
│   ├── PrepSection.jsx
│   ├── QuickLinksSection.jsx
│   └── ActivitySection.jsx
├── JobDrawer.jsx (existing detail drawer, extracted)
└── AutoApplyPanel.jsx (existing, extracted)
```

## Styling

- **Theme:** Dark mode only — blacks (#09090b, #0a0a0f, #0c0c14, #111118), subtle blue-tinted borders (#1a1a2e)
- **Accent:** Gold (#D4A017) for primary actions, selections, and branding
- **Status colors:** Green (#4ade80) applied, Cyan (#22d3ee) interview, Gold (#D4A017) new/offer, Red (#ef4444) errors
- **Typography:** Inter, all weights 400-800
- **Border radius:** 6-8px for cards/buttons, 10-12px for panels
- **Scrollbars:** Thin 3px, dark thumb (#222)
- **Transitions:** 0.15s for hovers, 0.2s for panel animations
- **No CSS framework** — continue with vanilla CSS (App.css)

## Responsive Behavior

- **< 1100px:** Trending panel collapses by default, context panel moves to a bottom sheet or hides behind a toggle
- **< 768px:** Sidebar collapses to a bottom tab bar (5 icons), single-column layout, drawer goes full-width
- **> 1400px:** All three panels comfortable, pipeline table stretches

## New API Endpoints Needed

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/trending` | GET | Returns array of trending items (tweets, news, HN) |
| `/api/insights` | GET | Returns 1-2 AI insight cards based on pipeline state |
| `/api/interview-prep` | GET | Returns rotating interview questions |
| `/api/profile/links` | GET/PUT | User's quick links (resume, portfolio, etc.) |

All can start with static JSON responses and be upgraded to dynamic later.

## Migration Strategy

- Current `App.jsx` (450 lines) gets decomposed into the component tree above
- Current `App.css` (217 lines) gets reorganized by component
- All existing functionality preserved — nothing removed, only reorganized
- Board view moves from default to its own sidebar section
- Pipeline table becomes the new default
- Backend endpoints unchanged — new ones are additive

## Out of Scope

- Authentication / multi-user support
- Dark/light theme toggle (dark only for now)
- Drag-and-drop on board view
- Real-time WebSocket updates (polling is fine)
- Mobile native app
