import { useState, useEffect, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════
   JOB PIPELINE — Full-Featured Scrollable Redesign
   Connected to real backend API
   ═══════════════════════════════════════════════════════════════ */

const API = import.meta.env.VITE_API_URL || '';

// ─── HELPERS ───────────────────────────────────────────────────

const statusConfig = {
  new: { label: "New", bg: "#065f46", text: "#34d399" },
  applied: { label: "Applied", bg: "#713f12", text: "#fbbf24" },
  hidden: { label: "Hidden", bg: "#3f3f46", text: "#a1a1aa" },
  interviewing: { label: "Interview", bg: "#1e3a5f", text: "#60a5fa" },
  saved: { label: "Saved", bg: "#4a1d6a", text: "#c084fc" },
  rejected: { label: "Rejected", bg: "#451a1a", text: "#f87171" },
  offer: { label: "Offer", bg: "#365314", text: "#a3e635" },
};

const tierColor = { A: "#22c55e", B: "#3b82f6", C: "#a78bfa", D: "#3f3f46" };

function ScoreBar({ score }) {
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: 80, height: 5, borderRadius: 3, background: "#27272a" }}>
        <div style={{ width: `${score}%`, height: "100%", borderRadius: 3, background: color, transition: "width 0.6s ease" }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color, fontFamily: "var(--mono)" }}>{score}</span>
    </div>
  );
}

function renderTweetBody(html) {
  if (!html) return '';
  const parts = html.split(/(<b>|<\/b>)/g).filter(Boolean);
  let bold = false;
  return parts.map((part, i) => {
    if (part === '<b>') { bold = true; return null; }
    if (part === '</b>') { bold = false; return null; }
    return bold ? <strong key={i} style={{ color: "#e4e4e7" }}>{part}</strong> : part;
  });
}

// ─── COLLAPSIBLE SECTION ───────────────────────────────────────

function Section({ id, title, subtitle, defaultOpen = true, children, badge, icon }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section id={id} style={{ marginBottom: 48, scrollMarginTop: 80 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex", alignItems: "center", gap: 12, width: "100%",
          background: "none", border: "none", cursor: "pointer", padding: "20px 0 16px",
          borderBottom: "1px solid #1e1e22",
        }}
      >
        {icon && <span style={{ fontSize: 18 }}>{icon}</span>}
        <span style={{
          fontSize: 13, fontWeight: 700, letterSpacing: 1.8, textTransform: "uppercase",
          color: "#a1a1aa", fontFamily: "var(--sans)",
        }}>
          {title}
        </span>
        {badge && (
          <span style={{
            fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 5,
            background: "#27272a", color: "#d4d4d8", fontFamily: "var(--mono)",
          }}>
            {badge}
          </span>
        )}
        {subtitle && <span style={{ fontSize: 13, color: "#3f3f46", marginLeft: 4 }}>{subtitle}</span>}
        <span style={{
          marginLeft: "auto", fontSize: 16, color: "#3f3f46",
          transition: "transform 0.25s ease",
          transform: open ? "rotate(0deg)" : "rotate(-90deg)",
          display: "inline-block",
        }}>▾</span>
      </button>
      {open && <div style={{ paddingTop: 24 }}>{children}</div>}
    </section>
  );
}

// ─── INPUT FIELD ───────────────────────────────────────────────

function Field({ label, value, onChange, placeholder, type = "text", half }) {
  return (
    <div style={{ flex: half ? "1 1 45%" : "1 1 100%", minWidth: half ? 200 : "auto" }}>
      <label style={{
        display: "block", fontSize: 11, fontWeight: 700, letterSpacing: 1,
        textTransform: "uppercase", color: "#52525b", marginBottom: 8,
        fontFamily: "var(--sans)",
      }}>
        {label}
      </label>
      {type === "textarea" ? (
        <textarea
          value={value} onChange={onChange} placeholder={placeholder} rows={3}
          style={{
            width: "100%", padding: "12px 16px", borderRadius: 8,
            border: "1px solid #27272a", background: "#18181b", color: "#e4e4e7",
            fontSize: 14, fontFamily: "var(--sans)", resize: "vertical",
          }}
        />
      ) : (
        <input
          type={type} value={value} onChange={onChange} placeholder={placeholder}
          style={{
            width: "100%", padding: "12px 16px", borderRadius: 8,
            border: "1px solid #27272a", background: "#18181b", color: "#e4e4e7",
            fontSize: 14, fontFamily: "var(--sans)",
          }}
        />
      )}
    </div>
  );
}

// ─── TAG INPUT ─────────────────────────────────────────────────

function TagInput({ label, tags, setTags, placeholder }) {
  const [input, setInput] = useState("");
  const add = () => {
    const val = input.trim();
    if (val && !tags.includes(val)) { setTags([...tags, val]); }
    setInput("");
  };
  return (
    <div style={{ flex: "1 1 100%" }}>
      <label style={{
        display: "block", fontSize: 11, fontWeight: 700, letterSpacing: 1,
        textTransform: "uppercase", color: "#52525b", marginBottom: 8,
        fontFamily: "var(--sans)",
      }}>
        {label}
      </label>
      <div style={{
        display: "flex", flexWrap: "wrap", gap: 8, padding: "10px 14px",
        borderRadius: 8, border: "1px solid #27272a", background: "#18181b", minHeight: 44,
        alignItems: "center",
      }}>
        {tags.map(t => (
          <span key={t} style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "4px 12px", borderRadius: 14, fontSize: 12, fontWeight: 600,
            background: "#172554", color: "#93c5fd", border: "1px solid #1e3a5f",
          }}>
            {t}
            <span
              onClick={() => setTags(tags.filter(x => x !== t))}
              style={{ cursor: "pointer", fontSize: 14, lineHeight: 1, color: "#60a5fa" }}
            >×</span>
          </span>
        ))}
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={tags.length === 0 ? placeholder : "Add more..."}
          style={{
            flex: 1, minWidth: 120, border: "none", background: "transparent",
            color: "#e4e4e7", fontSize: 13, outline: "none", fontFamily: "var(--sans)",
          }}
        />
      </div>
      <p style={{ fontSize: 11, color: "#3f3f46", marginTop: 6 }}>Press Enter to add</p>
    </div>
  );
}

// ─── JOB CARD ──────────────────────────────────────────────────

function JobCard({ job, onUpdateStatus }) {
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const st = statusConfig[job.status] || statusConfig.new;
  const tier = job.tier || 'D';
  const timeAgo = job.created_at ? new Date(job.created_at + 'Z').toLocaleDateString() : '';

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "#141416" : "#111113",
        border: `1px solid ${hovered ? "#2a2a2e" : "#1e1e22"}`,
        borderLeft: `3px solid ${tierColor[tier] || '#3f3f46'}`,
        borderRadius: 12, padding: "22px 28px", marginBottom: 12,
        cursor: "pointer", transition: "all 0.2s ease",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 250 }}>
          <h3 style={{
            margin: 0, fontSize: 16, fontWeight: 600, color: "#f4f4f5",
            lineHeight: 1.45, fontFamily: "var(--sans)",
          }}>
            {job.title}
          </h3>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
            {job.company && job.company !== "—" && (
              <span style={{ fontSize: 14, color: "#a1a1aa", fontWeight: 500 }}>{job.company}</span>
            )}
            {job.company && job.company !== "—" && job.location && <span style={{ color: "#2a2a2e" }}>·</span>}
            {job.location && <span style={{ fontSize: 13, color: "#52525b" }}>{job.location}</span>}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0, flexWrap: "wrap" }}>
          <ScoreBar score={job.fit_score || 0} />
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: 0.5, padding: "4px 10px",
            borderRadius: 5, background: st.bg, color: st.text,
          }}>{st.label}</span>
          <span style={{
            fontSize: 10, fontWeight: 600, padding: "3px 9px", borderRadius: 4,
            background: (tierColor[tier] || '#3f3f46') + "12", color: tierColor[tier] || '#3f3f46',
            border: `1px solid ${(tierColor[tier] || '#3f3f46')}25`,
          }}>Tier {tier}</span>
        </div>
      </div>
      <div style={{ marginTop: 8, fontSize: 11, color: "#2a2a2e" }}>{timeAgo}</div>

      {expanded && (
        <div style={{
          marginTop: 18, paddingTop: 18, borderTop: "1px solid #1e1e22",
        }}>
          {job.cover_letter && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Cover Letter</div>
              <p style={{ fontSize: 13, color: "#71717a", lineHeight: 1.7, whiteSpace: "pre-wrap", margin: 0 }}>{job.cover_letter}</p>
            </div>
          )}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {job.url && (
              <a href={job.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{
                padding: "9px 22px", borderRadius: 7, fontSize: 13, fontWeight: 600,
                border: "none", background: "#2563eb", color: "#fff", cursor: "pointer",
                fontFamily: "var(--sans)", textDecoration: "none", display: "inline-block",
              }}>Apply Now</a>
            )}
            {job.status !== 'saved' && (
              <button onClick={e => { e.stopPropagation(); onUpdateStatus(job.id, 'saved'); }} style={{
                padding: "9px 22px", borderRadius: 7, fontSize: 13, fontWeight: 600,
                border: "1px solid #27272a", background: "transparent", color: "#71717a",
                cursor: "pointer", fontFamily: "var(--sans)",
              }}>Save</button>
            )}
            {job.status !== 'hidden' && (
              <button onClick={e => { e.stopPropagation(); onUpdateStatus(job.id, 'hidden'); }} style={{
                padding: "9px 22px", borderRadius: 7, fontSize: 13, fontWeight: 600,
                border: "1px solid #27272a", background: "transparent", color: "#71717a",
                cursor: "pointer", fontFamily: "var(--sans)",
              }}>Hide</button>
            )}
            {job.status !== 'applied' && (
              <button onClick={e => { e.stopPropagation(); onUpdateStatus(job.id, 'applied'); }} style={{
                padding: "9px 22px", borderRadius: 7, fontSize: 13, fontWeight: 600,
                border: "1px solid #27272a", background: "transparent", color: "#71717a",
                cursor: "pointer", fontFamily: "var(--sans)",
              }}>Mark Applied</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── TWEET CARD ────────────────────────────────────────────────

function TweetCard({ tweet }) {
  const [hovered, setHovered] = useState(false);
  return (
    <a
      href={tweet.url || '#'}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "#141416" : "#111113",
        border: `1px solid ${hovered ? "#2a2a2e" : "#1e1e22"}`,
        borderRadius: 12, padding: "22px 24px", transition: "all 0.2s",
        textDecoration: "none", color: "inherit", display: "block",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#e4e4e7" }}>{tweet.name || tweet.author}</span>
          <span style={{ fontSize: 13, color: "#3f3f46", marginLeft: 8 }}>{tweet.handle}</span>
        </div>
        <span style={{ fontSize: 12, color: "#3f3f46" }}>{tweet.time}</span>
      </div>
      <p style={{ fontSize: 14, color: "#a1a1aa", lineHeight: 1.65, margin: "0 0 14px 0" }}>{renderTweetBody(tweet.body || tweet.text)}</p>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 6 }}>
          {(tweet.tags || []).map((t, i) => {
            const label = typeof t === 'string' ? t : t.label;
            return (
              <span key={i} style={{
                fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 10,
                background: "#172554", color: "#60a5fa", letterSpacing: 0.5,
              }}>{label}</span>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 14, fontSize: 12, color: "#3f3f46" }}>
          <span>💬 {tweet.comments || tweet.replies || ''}</span>
          <span>❤️ {tweet.likes || ''}</span>
        </div>
      </div>
    </a>
  );
}

// ─── INTERVIEW CARD ────────────────────────────────────────────

const INTERVIEW_QS = [
  { q: "Describe a time you launched a product in a competitive market. What was your GTM strategy?", tag: "Behavioral — GTM", color: "#d97706" },
  { q: "How do you measure the ROI of brand campaign vs. performance marketing?", tag: "Strategic — Measurement", color: "#2563eb" },
  { q: "Tell me about a cross-functional initiative you led that drove measurable revenue impact.", tag: "Behavioral — Leadership", color: "#7c3aed" },
  { q: "Walk me through how you'd build a demand gen engine from scratch at a Series B startup.", tag: "Tactical — Demand Gen", color: "#059669" },
  { q: "How do you align sales and marketing teams around shared revenue goals?", tag: "Strategic — Alignment", color: "#dc2626" },
];

function InterviewCard({ item, index }) {
  const [showTip, setShowTip] = useState(false);
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={() => setShowTip(!showTip)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "#141416" : "#111113",
        border: `1px solid ${hovered ? "#2a2a2e" : "#1e1e22"}`,
        borderRadius: 12, padding: 28, cursor: "pointer",
        transition: "all 0.2s", borderTop: `3px solid ${item.color}`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: item.color,
        }}>{item.tag}</span>
        <span style={{ fontSize: 12, color: "#27272a", fontFamily: "var(--mono)" }}>Q{index + 1}</span>
      </div>
      <p style={{
        margin: 0, fontSize: 16, lineHeight: 1.65, color: "#d4d4d8",
        fontFamily: "var(--sans)", fontStyle: "italic",
      }}>"{item.q}"</p>
      {showTip && (
        <div style={{ marginTop: 20, paddingTop: 18, borderTop: "1px solid #1e1e22" }}>
          <p style={{ margin: 0, fontSize: 13, color: "#52525b", lineHeight: 1.6 }}>
            💡 Frame using <strong style={{ color: "#71717a" }}>STAR</strong> — Situation, Task, Action, Result. Keep it under 2 minutes. Click again to collapse.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── DOCUMENT CARD ─────────────────────────────────────────────

function DocCard({ doc }) {
  const [hovered, setHovered] = useState(false);
  const hasUrl = doc.url && doc.url.startsWith('http');
  const Wrapper = hasUrl ? 'a' : 'div';
  const wrapperProps = hasUrl ? { href: doc.url, target: "_blank", rel: "noopener noreferrer" } : {};
  return (
    <Wrapper
      {...wrapperProps}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "#141416" : "#111113",
        border: `1px solid ${hovered ? "#2a2a2e" : "#1e1e22"}`,
        borderRadius: 12, padding: "18px 22px",
        display: "flex", alignItems: "center", gap: 16,
        cursor: "pointer", transition: "all 0.2s",
        textDecoration: "none", color: "inherit",
      }}
    >
      <span style={{ fontSize: 28 }}>{doc.icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#e4e4e7" }}>{doc.title}</div>
        <div style={{ fontSize: 12, color: "#3f3f46", marginTop: 4 }}>
          {doc.sub || ''}
        </div>
      </div>
      {hasUrl && <span style={{ fontSize: 14, color: "#3f3f46" }}>↗</span>}
    </Wrapper>
  );
}

// ─── FILTER & SOURCE BARS ──────────────────────────────────────

function FilterBar({ active, setActive }) {
  const filters = ["All", "New", "Applied", "Saved", "Hidden", "Interviewing"];
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
      {filters.map(f => (
        <button key={f} onClick={() => setActive(f)} style={{
          padding: "8px 20px", borderRadius: 20, fontSize: 12, fontWeight: 600,
          border: active === f ? "1px solid #2563eb" : "1px solid #1e1e22",
          background: active === f ? "#172554" : "transparent",
          color: active === f ? "#93c5fd" : "#52525b",
          cursor: "pointer", fontFamily: "var(--sans)",
        }}>{f}</button>
      ))}
    </div>
  );
}

function SourceTabs({ active, setActive }) {
  const tabs = ["All Sources", "LinkedIn", "Greenhouse", "Lever"];
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
      {tabs.map(t => (
        <button key={t} onClick={() => setActive(t)} style={{
          padding: "6px 14px", borderRadius: 6, fontSize: 11, fontWeight: 600,
          border: "none",
          background: active === t ? "#1e1e22" : "transparent",
          color: active === t ? "#d4d4d8" : "#3f3f46",
          cursor: "pointer", fontFamily: "var(--sans)",
        }}>{t}</button>
      ))}
    </div>
  );
}

// ─── SIDENAV ───────────────────────────────────────────────────

function SideNav({ activeSection }) {
  const links = [
    { id: "preferences", label: "Job Preferences", icon: "⚙️" },
    { id: "insights", label: "AI Insights", icon: "💡" },
    { id: "listings", label: "Job Listings", icon: "📋" },
    { id: "trending", label: "X / Trending", icon: "📰" },
    { id: "interview", label: "Interview Prep", icon: "🎤" },
    { id: "vault", label: "Document Vault", icon: "📁" },
    { id: "activity", label: "Activity Log", icon: "📊" },
  ];
  return (
    <nav style={{
      position: "fixed", left: 0, top: 64, bottom: 0, width: 56,
      background: "#0c0c0e", borderRight: "1px solid #1e1e22",
      display: "flex", flexDirection: "column", alignItems: "center",
      paddingTop: 20, gap: 6, zIndex: 90,
    }}>
      {links.map(l => (
        <a
          key={l.id}
          href={`#${l.id}`}
          title={l.label}
          style={{
            width: 40, height: 40, borderRadius: 10,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, textDecoration: "none",
            background: activeSection === l.id ? "#1e1e22" : "transparent",
            transition: "background 0.15s",
          }}
        >
          {l.icon}
        </a>
      ))}
    </nav>
  );
}

// ─── AI TIPS ───────────────────────────────────────────────────

const FALLBACK_TIPS = [
  { title: "Today's Tip", body: "Focus on following up with your most recent applications. Personalized follow-ups within 5 business days increase response rates.", icon: "💡" },
  { title: "Pattern Detected", body: "Roles with \"Director\" or \"VP\" in the title tend to score higher for your profile. Lean into these keywords.", icon: "📊" },
];

// ═══════════════════════════════════════════════════════════════
//  MAIN APP
// ═══════════════════════════════════════════════════════════════

export default function App() {
  // API data
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [trending, setTrending] = useState({ tweets: [], news: [] });
  const [links, setLinks] = useState([]);
  const [insights, setInsights] = useState(FALLBACK_TIPS);

  // UI state
  const [filter, setFilter] = useState("All");
  const [source, setSource] = useState("All Sources");
  const [search, setSearch] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [activeSection, setActiveSection] = useState("preferences");
  const [searchRunning, setSearchRunning] = useState(false);
  const [applyRunning, setApplyRunning] = useState(false);

  // Job Preferences (from localStorage)
  const savedPrefs = (() => { try { return JSON.parse(localStorage.getItem('jobhq-settings')) || {}; } catch { return {}; } })();
  const [prefRole, setPrefRole] = useState(savedPrefs.targetRole || "VP of Marketing");
  const [prefLevel, setPrefLevel] = useState("VP / Director");
  const [prefLocation, setPrefLocation] = useState(savedPrefs.targetLocation || "Remote · United States");
  const [prefSalary, setPrefSalary] = useState(savedPrefs.minSalary ? `$${savedPrefs.minSalary}k+` : "$180k – $280k");
  const [prefKeywords, setPrefKeywords] = useState(["Growth Marketing", "Demand Gen", "AI", "SEM", "Paid Media"]);
  const [prefExclude, setPrefExclude] = useState(["Entry Level", "Intern", "Coordinator"]);
  const [prefNotes, setPrefNotes] = useState("Prioritize roles that mention AI, automation, or fractional/consulting. B2B SaaS preferred.");
  const [prefSaved, setPrefSaved] = useState(false);

  // ── Fetch data ──
  const fetchJobs = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: '500' });
      if (search) params.set('search', search);
      const res = await fetch(`${API}/api/jobs?${params}`);
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch (err) { console.error('Failed to fetch jobs:', err); }
  }, [search]);

  const fetchStats = async () => {
    try { const res = await fetch(`${API}/api/stats`); setStats(await res.json()); } catch {}
  };

  const fetchActivity = async () => {
    try { const res = await fetch(`${API}/api/activity?limit=20`); setActivity(await res.json()); } catch {}
  };

  const fetchTrending = async () => {
    try { const res = await fetch(`${API}/api/trending`); setTrending(await res.json()); } catch {}
  };

  const fetchLinks = async () => {
    try { const res = await fetch(`${API}/api/profile/links`); const data = await res.json(); if (data.length) setLinks(data); } catch {}
  };

  const fetchInsights = async () => {
    try { const res = await fetch(`${API}/api/insights`); const data = await res.json(); if (data.length) setInsights(data); } catch {}
  };

  useEffect(() => { fetchJobs(); }, [fetchJobs]);
  useEffect(() => {
    fetchStats(); fetchActivity(); fetchTrending(); fetchLinks(); fetchInsights();
    const i = setInterval(() => { fetchStats(); fetchActivity(); }, 30000);
    return () => clearInterval(i);
  }, []);
  useEffect(() => { setTimeout(() => setLoaded(true), 80); }, []);

  // Scroll spy
  useEffect(() => {
    const handler = () => {
      const ids = ["preferences", "insights", "listings", "trending", "interview", "vault", "activity"];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top < 200 && rect.bottom > 100) { setActiveSection(id); break; }
        }
      }
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // ── Actions ──
  const triggerSearch = async () => {
    setSearchRunning(true);
    await fetch(`${API}/api/search`, { method: 'POST' });
    const poll = setInterval(async () => {
      const res = await fetch(`${API}/api/search/status`);
      const data = await res.json();
      if (!data.inProgress) {
        clearInterval(poll); setSearchRunning(false);
        fetchJobs(); fetchStats(); fetchActivity();
      }
    }, 5000);
  };

  const triggerAutoApply = async () => {
    setApplyRunning(true);
    await fetch(`${API}/api/apply/auto`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tiers: ['A', 'B'], maxApps: 10 }),
    });
    const poll = setInterval(async () => {
      const res = await fetch(`${API}/api/apply/status`);
      const data = await res.json();
      if (!data.inProgress) {
        clearInterval(poll); setApplyRunning(false);
        fetchJobs(); fetchStats(); fetchActivity();
      }
    }, 5000);
  };

  const updateStatus = async (id, status) => {
    await fetch(`${API}/api/jobs/${id}/status`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    fetchJobs(); fetchStats();
  };

  const handleSavePrefs = () => {
    localStorage.setItem('jobhq-settings', JSON.stringify({
      targetRole: prefRole, targetLocation: prefLocation, minSalary: prefSalary,
    }));
    setPrefSaved(true);
    setTimeout(() => setPrefSaved(false), 3000);
  };

  const handleScanNow = () => {
    handleSavePrefs();
    triggerSearch();
  };

  // ── Filter jobs ──
  const filteredJobs = jobs.filter(j => {
    if (filter !== "All" && j.status !== filter.toLowerCase()) return false;
    if (source === "LinkedIn") return (j.url || '').includes('linkedin.com') || j.source === 'LinkedIn';
    if (source === "Greenhouse") return (j.url || '').includes('greenhouse');
    if (source === "Lever") return (j.url || '').includes('lever.co');
    return true;
  });

  const s = stats?.stats || {};

  const STAT_ITEMS = [
    { label: "Total Found", value: s.total || jobs.length, icon: "🔍" },
    { label: "Tier A", value: s.tier_a || 0, icon: "⭐" },
    { label: "Tier B", value: s.tier_b || 0, icon: "🟢" },
    { label: "Tier C", value: s.tier_c || 0, icon: "🔵" },
    { label: "Applied", value: s.applied || 0, icon: "📨" },
    { label: "Interviews", value: s.interviewing || 0, icon: "🎯" },
    { label: "Offers", value: s.offers || 0, icon: "🏆" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        :root {
          --sans: 'DM Sans', system-ui, sans-serif;
          --mono: 'JetBrains Mono', monospace;
          --bg: #09090b;
          --card: #111113;
          --border: #1e1e22;
          --border-hover: #2a2a2e;
          --text: #f4f4f5;
          --muted: #52525b;
          --dim: #3f3f46;
          --blue: #2563eb;
        }
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: var(--bg); font-family: var(--sans); }
        ::selection { background: #2563eb33; color: #fff; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1e1e22; border-radius: 3px; }
        input:focus, textarea:focus { border-color: #2563eb !important; outline: none; }
        a { color: inherit; text-decoration: none; }
      `}</style>

      <div style={{
        minHeight: "100vh", background: "var(--bg)", color: "var(--text)",
        fontFamily: "var(--sans)",
        opacity: loaded ? 1 : 0, transition: "opacity 0.4s ease",
      }}>

        {/* ══════ NAVBAR ══════ */}
        <nav style={{
          padding: "12px 24px 12px 72px",
          borderBottom: "1px solid var(--border)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          position: "sticky", top: 0, zIndex: 100,
          background: "rgba(9,9,11,0.94)", backdropFilter: "blur(16px)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.5 }}>
              <span style={{ color: "#3b82f6" }}>JQ</span> Pipeline
            </span>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 5,
              background: "#172554", color: "#60a5fa", fontFamily: "var(--mono)",
            }}>{s.total || jobs.length} jobs</span>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={triggerSearch} disabled={searchRunning} style={{
              padding: "8px 20px", borderRadius: 8, fontSize: 12, fontWeight: 600,
              border: "1px solid var(--border)", background: "transparent",
              color: searchRunning ? "#22c55e" : "#71717a",
              cursor: searchRunning ? "default" : "pointer", fontFamily: "var(--sans)",
            }}>{searchRunning ? "Scanning..." : "Scan Jobs"}</button>
            <button onClick={triggerAutoApply} disabled={applyRunning} style={{
              padding: "8px 20px", borderRadius: 8, fontSize: 12, fontWeight: 600,
              border: "none", background: applyRunning ? "#1e3a5f" : "var(--blue)",
              color: "#fff", cursor: applyRunning ? "default" : "pointer",
              fontFamily: "var(--sans)",
            }}>{applyRunning ? "Applying..." : "Auto-Apply"}</button>
          </div>
        </nav>

        <SideNav activeSection={activeSection} />

        {/* ══════ PAGE ══════ */}
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "36px 28px 120px", marginLeft: 72 }}>

          {/* ── HERO + STATS ── */}
          <div style={{ marginBottom: 20 }}>
            <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: -0.5, color: "#f4f4f5", marginBottom: 6 }}>
              Your Job Pipeline
            </h1>
            <p style={{ fontSize: 14, color: "#3f3f46", lineHeight: 1.6 }}>
              {stats?.lastRun ? `Last scanned ${new Date(stats.lastRun.completed_at + 'Z').toLocaleString()}` : 'Loading...'}
              {stats?.lastRun ? ` · ${stats.lastRun.jobs_found} found, ${stats.lastRun.jobs_new} new` : ''}
            </p>
          </div>
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(108px, 1fr))",
            gap: 10, marginBottom: 48,
          }}>
            {STAT_ITEMS.map(st => (
              <div key={st.label} style={{
                background: "var(--card)", border: "1px solid var(--border)",
                borderRadius: 10, padding: "18px 14px", textAlign: "center",
              }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>{st.icon}</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: "#f4f4f5", fontFamily: "var(--mono)", lineHeight: 1 }}>{st.value}</div>
                <div style={{ fontSize: 10, color: "#3f3f46", marginTop: 6, fontWeight: 600, letterSpacing: 0.8, textTransform: "uppercase" }}>{st.label}</div>
              </div>
            ))}
          </div>

          {/* ══════ JOB PREFERENCES ══════ */}
          <Section id="preferences" title="Job Preferences" icon="⚙️" subtitle="Define what you're looking for" defaultOpen={false}>
            <div style={{
              background: "var(--card)", border: "1px solid var(--border)",
              borderRadius: 14, padding: 32,
            }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 20, marginBottom: 20 }}>
                <Field label="Target Role" value={prefRole} onChange={e => setPrefRole(e.target.value)} placeholder="e.g. VP of Marketing" half />
                <Field label="Level" value={prefLevel} onChange={e => setPrefLevel(e.target.value)} placeholder="e.g. Director, VP, C-Suite" half />
                <Field label="Location Preference" value={prefLocation} onChange={e => setPrefLocation(e.target.value)} placeholder="e.g. Remote, San Diego, US" half />
                <Field label="Salary Range" value={prefSalary} onChange={e => setPrefSalary(e.target.value)} placeholder="e.g. $150k – $250k" half />
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 20, marginBottom: 20 }}>
                <TagInput label="Must-Have Keywords" tags={prefKeywords} setTags={setPrefKeywords} placeholder="e.g. Growth, SaaS, AI..." />
                <TagInput label="Exclude Keywords" tags={prefExclude} setTags={setPrefExclude} placeholder="e.g. Entry Level, Intern..." />
              </div>
              <Field label="Notes for AI Scanner" value={prefNotes} onChange={e => setPrefNotes(e.target.value)} placeholder="Any additional context..." type="textarea" />

              <div style={{ display: "flex", gap: 12, marginTop: 24, alignItems: "center" }}>
                <button onClick={handleScanNow} style={{
                  padding: "12px 32px", borderRadius: 8, fontSize: 14, fontWeight: 700,
                  border: "none", background: "var(--blue)", color: "#fff",
                  cursor: "pointer", fontFamily: "var(--sans)",
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  🔍 Save & Scan Now
                </button>
                <button onClick={handleSavePrefs} style={{
                  padding: "12px 24px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                  border: "1px solid var(--border)", background: "transparent", color: "#71717a",
                  cursor: "pointer", fontFamily: "var(--sans)",
                }}>Save Preferences</button>
                {prefSaved && (
                  <span style={{ fontSize: 13, color: "#22c55e", fontWeight: 600 }}>
                    ✓ Preferences saved{searchRunning ? " — scanning..." : ""}
                  </span>
                )}
              </div>
            </div>
          </Section>

          {/* ══════ AI INSIGHTS ══════ */}
          <Section id="insights" title="AI Insights" icon="💡" subtitle="Personalized tips from your activity" badge={String(insights.length)}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 14 }}>
              {insights.map((tip, i) => (
                <div key={i} style={{
                  background: "var(--card)", border: "1px solid var(--border)",
                  borderRadius: 12, padding: 26,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                    <span style={{ fontSize: 20 }}>{tip.icon}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#e4e4e7" }}>{tip.title}</span>
                  </div>
                  <p style={{ fontSize: 14, color: "#71717a", lineHeight: 1.7, margin: 0 }}>{tip.body}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* ══════ JOB LISTINGS ══════ */}
          <Section id="listings" title="Job Listings" icon="📋" badge={String(filteredJobs.length)} defaultOpen={true}>
            <div style={{ marginBottom: 18 }}>
              <input
                type="text" placeholder="Search jobs, companies..." value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: "100%", maxWidth: 420, padding: "12px 18px", borderRadius: 10,
                  border: "1px solid var(--border)", background: "var(--card)",
                  color: "#e4e4e7", fontSize: 14, fontFamily: "var(--sans)",
                }}
              />
            </div>
            <SourceTabs active={source} setActive={setSource} />
            <FilterBar active={filter} setActive={setFilter} />
            <div style={{ marginTop: 16 }}>
              {filteredJobs.slice(0, 50).map(job => <JobCard key={job.id} job={job} onUpdateStatus={updateStatus} />)}
              {filteredJobs.length > 50 && (
                <p style={{ textAlign: "center", color: "var(--muted)", padding: 20, fontSize: 13 }}>
                  Showing 50 of {filteredJobs.length} jobs. Use search to narrow results.
                </p>
              )}
              {filteredJobs.length === 0 && (
                <p style={{ textAlign: "center", color: "var(--muted)", padding: 48, fontSize: 14 }}>No jobs match your current filters.</p>
              )}
            </div>
          </Section>

          {/* ══════ X / TRENDING ══════ */}
          <Section id="trending" title="X / Trending" icon="📰" subtitle="Industry pulse" badge={String((trending.tweets || []).length + (trending.news || []).length)} defaultOpen={true}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: 14 }}>
              {(trending.tweets || []).map((tw, i) => <TweetCard key={`t-${i}`} tweet={tw} />)}
            </div>
            {(trending.news || []).length > 0 && (
              <>
                <h3 style={{ marginTop: 24, marginBottom: 14, fontSize: 13, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: 1.5 }}>News</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: 14 }}>
                  {(trending.news || []).map((n, i) => (
                    <a key={`n-${i}`} href={n.url || '#'} target="_blank" rel="noopener noreferrer" style={{
                      background: "#111113", border: "1px solid #1e1e22", borderRadius: 12,
                      padding: "18px 24px", textDecoration: "none", color: "inherit", display: "block",
                    }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#3b82f6", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>{n.source}</div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: "#e4e4e7", lineHeight: 1.5 }}>{n.title}</div>
                      <div style={{ fontSize: 12, color: "#3f3f46", marginTop: 8 }}>{n.time} · {n.readTime} read</div>
                    </a>
                  ))}
                </div>
              </>
            )}
          </Section>

          {/* ══════ INTERVIEW PREP ══════ */}
          <Section id="interview" title="Interview Prep" icon="🎤" subtitle="Practice questions for your target roles" badge={String(INTERVIEW_QS.length)} defaultOpen={false}>
            <p style={{ fontSize: 14, color: "#3f3f46", marginBottom: 20, lineHeight: 1.6 }}>
              Click any question to reveal a practice tip. Tailored to VP/Director marketing roles.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
              {INTERVIEW_QS.map((item, i) => <InterviewCard key={i} item={item} index={i} />)}
            </div>
          </Section>

          {/* ══════ DOCUMENT VAULT ══════ */}
          <Section id="vault" title="Document Vault" icon="📁" subtitle="Resume, portfolio, and profiles" badge={String(links.length)} defaultOpen={false}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
              {links.map((doc, i) => <DocCard key={i} doc={doc} />)}
              {links.length === 0 && (
                <p style={{ color: "var(--muted)", fontSize: 14 }}>No links configured. Add them in Settings.</p>
              )}
            </div>
          </Section>

          {/* ══════ ACTIVITY LOG ══════ */}
          <Section id="activity" title="Activity Log" icon="📊" subtitle="Recent pipeline events" defaultOpen={false}>
            <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: 28 }}>
              {activity.length === 0 && (
                <p style={{ color: "var(--muted)", fontSize: 14, textAlign: "center", padding: 24 }}>No activity yet.</p>
              )}
              {activity.slice(0, 15).map((entry, i) => (
                <div key={i} style={{
                  display: "flex", gap: 20, alignItems: "flex-start",
                  padding: "14px 0",
                  borderBottom: i < activity.length - 1 ? "1px solid #1a1a1e" : "none",
                }}>
                  <span style={{
                    fontSize: 10, fontWeight: 600, color: "#27272a", minWidth: 80,
                    fontFamily: "var(--mono)", paddingTop: 3,
                  }}>{new Date(entry.created_at + 'Z').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span style={{
                    width: 8, height: 8, borderRadius: "50%", marginTop: 5, flexShrink: 0,
                    background: entry.type === 'apply' ? '#f59e0b' : entry.type === 'search' ? '#3b82f6' : entry.type === 'status' ? '#a78bfa' : '#52525b',
                  }} />
                  <span style={{ fontSize: 14, color: "#71717a", lineHeight: 1.55 }}>{entry.message}</span>
                </div>
              ))}
            </div>
          </Section>

        </div>
      </div>
    </>
  );
}
