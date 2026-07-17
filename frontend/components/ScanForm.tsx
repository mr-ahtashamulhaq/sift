import { useState, useRef } from "react";
import { X, Search, Zap, Link2, Globe, AlertCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ScanRequest, SkillEntry } from "@/lib/types";

const SUGGESTIONS = [
  "React", "TypeScript", "Python", "Node.js", "Next.js",
  "Figma", "SEO", "Copywriting", "Data Analysis", "WordPress",
  "Vue.js", "Django", "GraphQL", "DevOps", "iOS",
];

const EXP_OPTS = [
  { value: "junior", label: "Junior",   sub: "0–2 yrs" },
  { value: "mid",    label: "Mid",      sub: "2–5 yrs" },
  { value: "senior", label: "Senior",   sub: "5+ yrs"  },
] as const;

const LEVELS: SkillEntry["level"][] = ["beginner", "competent", "expert"];

interface Props {
  onSubmit: (r: ScanRequest) => void;
  loading: boolean;
  defaultSkills?: string[];
  defaultRate?: number;
  defaultExp?: "junior" | "mid" | "senior";
  defaultNiche?: string;
  defaultGithub?: string;
}

export default function ScanForm({
  onSubmit, loading,
  defaultSkills = [], defaultRate = 0,
  defaultExp = "mid", defaultNiche = "",
  defaultGithub = "",
}: Props) {
  const [input, setInput]         = useState("");
  const [skills, setSkills]       = useState<SkillEntry[]>(
    defaultSkills.map(name => ({ name, level: "competent" as const }))
  );
  const [rate, setRate]           = useState(defaultRate ? String(defaultRate) : "");
  const [exp, setExp]             = useState<"junior" | "mid" | "senior">(defaultExp);
  const [niche, setNiche]         = useState(defaultNiche);
  const [github, setGithub]       = useState(defaultGithub);
  const [portfolio, setPortfolio] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const profileIncomplete = !defaultSkills.length || !defaultRate;

  function add(name: string) {
    const t = name.trim();
    if (t && !skills.find(s => s.name === t) && skills.length < 8) {
      setSkills(prev => [...prev, { name: t, level: "competent" as const }]);
      setInput("");
      inputRef.current?.focus();
    }
  }

  function cycleLevel(name: string) {
    setSkills(prev => prev.map(s => {
      if (s.name !== name) return s;
      const next = LEVELS[(LEVELS.indexOf(s.level) + 1) % LEVELS.length];
      return { ...s, level: next };
    }));
  }

  function remove(name: string) {
    setSkills(prev => prev.filter(s => s.name !== name));
  }

  const disabled = loading || skills.length === 0 || !rate || parseFloat(rate) <= 0;

  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        if (!disabled) onSubmit({
          skills,
          hourly_rate: parseFloat(rate),
          experience: exp,
          niche: niche.trim() || undefined,
          github_url: github.trim() || undefined,
          portfolio_url: portfolio.trim() || undefined,
        });
      }}
      className="card card-p-lg"
      style={{ maxWidth: 640 }}
    >
      {/* ── Profile incomplete banner ── */}
      {profileIncomplete && (
        <Link href="/app/settings" style={{ textDecoration: "none" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            background: "rgba(201,160,64,0.08)", border: "1px solid var(--gold-border)",
            borderRadius: "var(--radius)", padding: "9px 12px", marginBottom: 18,
            cursor: "pointer",
          }}>
            <AlertCircle size={13} color="var(--gold)" style={{ flexShrink: 0 }} />
            <p style={{ fontSize: 12, color: "var(--gold)", flex: 1, fontWeight: 400 }}>
              {!defaultSkills.length
                ? "Your profile has no skills set — scores will be generic. Save your skills in Settings."
                : "Your profile has no rate set — add it in Settings to pre-fill this form."}
            </p>
            <ArrowRight size={12} color="var(--gold)" style={{ flexShrink: 0 }} />
          </div>
        </Link>
      )}

      {/* ── Header ── */}
      <div className="scan-form-hd">
        <div className="scan-form-hd-icon"><Zap size={22} color="#fff" /></div>
        <p className="scan-form-hd-title">Find your next win</p>
        <p className="scan-form-hd-sub">AI-powered scan across Upwork, Freelancer, Guru, PeoplePerHour & Toptal</p>
      </div>

      {/* ── Skills ── */}
      <div className="form-group" style={{ marginBottom: 20 }}>
        <label className="input-label">
          Your skills
          <span style={{ fontWeight: 300, textTransform: "none", letterSpacing: 0, color: "var(--text-3)", marginLeft: 6 }}>
            up to 8 · click the badge to set your level
          </span>
        </label>

        {skills.length > 0 ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
            {skills.map(s => {
              const levelColor = s.level === "expert" ? "var(--gold)" : s.level === "competent" ? "var(--text-1)" : "var(--text-3)";
              const levelBg = s.level === "expert" ? "rgba(201,160,64,0.18)" : "rgba(255,255,255,0.06)";
              return (
                <span key={s.name} className="skill-chip">
                  {s.name}
                  <button
                    type="button"
                    onClick={() => cycleLevel(s.name)}
                    title="Click to change: Beginner → Competent → Expert"
                    style={{
                      background: levelBg,
                      border: "none", cursor: "pointer",
                      fontSize: 10, fontWeight: 700, letterSpacing: "0.05em",
                      textTransform: "uppercase", padding: "1px 5px",
                      borderRadius: 3, color: levelColor,
                      marginLeft: 2, lineHeight: 1.4,
                    }}
                  >
                    {s.level === "beginner" ? "Beg" : s.level === "competent" ? "Mid" : "Pro"}
                  </button>
                  <button type="button" className="skill-chip-x" onClick={() => remove(s.name)}>
                    <X size={10} />
                  </button>
                </span>
              );
            })}
          </div>
        ) : (
          <div style={{
            padding: "12px 14px", marginBottom: 10,
            background: "var(--bg-soft)", border: "1px dashed var(--border-2)",
            borderRadius: "var(--radius)", fontSize: 12, color: "var(--text-3)",
            textAlign: "center", fontWeight: 300,
          }}>
            Add your skills below — the score is personalised to your level in each one
          </div>
        )}

        <div style={{ position: "relative" }}>
          <Search size={13} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)", pointerEvents: "none" }} />
          <input
            ref={inputRef}
            type="text" value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(input); } }}
            placeholder="Type a skill and press Enter..."
            className="input" style={{ paddingLeft: 34 }}
          />
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 10 }}>
          {SUGGESTIONS.filter(s => !skills.find(x => x.name === s)).slice(0, 8).map(s => (
            <button key={s} type="button" className="sugg-btn" onClick={() => add(s)}>+ {s}</button>
          ))}
        </div>
      </div>

      {/* ── Niche ── */}
      <div className="form-group" style={{ marginBottom: 20 }}>
        <label className="input-label">
          Your niche
          <span style={{ fontWeight: 300, textTransform: "none", letterSpacing: 0, color: "var(--text-3)", marginLeft: 6 }}>optional — personalises proposal angles</span>
        </label>
        <input
          type="text"
          value={niche}
          onChange={e => setNiche(e.target.value.slice(0, 100))}
          placeholder="e.g. React dashboards for fintech startups"
          className="input"
        />
      </div>

      {/* ── Portfolio ── */}
      <div className="form-group" style={{ marginBottom: 20 }}>
        <label className="input-label">
          Portfolio
          <span style={{ fontWeight: 300, textTransform: "none", letterSpacing: 0, color: "var(--text-3)", marginLeft: 6 }}>optional — AI reads your work to personalise the score</span>
        </label>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ position: "relative" }}>
            <Link2 size={13} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)", pointerEvents: "none" }} />
            <input
              type="url"
              value={github}
              onChange={e => setGithub(e.target.value)}
              placeholder="https://github.com/yourname"
              className="input" style={{ paddingLeft: 34 }}
            />
          </div>
          <div style={{ position: "relative" }}>
            <Globe size={13} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)", pointerEvents: "none" }} />
            <input
              type="url"
              value={portfolio}
              onChange={e => setPortfolio(e.target.value)}
              placeholder="Behance, Dribbble, personal site, Contra…"
              className="input" style={{ paddingLeft: 34 }}
            />
          </div>
        </div>
      </div>

      {/* ── Rate + Experience ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 14, marginBottom: 24 }}>
        <div className="form-group">
          <label className="input-label">Hourly rate (USD)</label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "var(--text-3)", fontWeight: 500 }}>$</span>
            <input type="number" value={rate} onChange={e => setRate(e.target.value)}
              placeholder="45" min="1" max="999" className="input" style={{ paddingLeft: 24 }} />
          </div>
        </div>
        <div className="form-group">
          <label className="input-label">Experience level</label>
          <div style={{ display: "flex", gap: 6 }}>
            {EXP_OPTS.map(o => (
              <button
                key={o.value} type="button"
                onClick={() => setExp(o.value)}
                style={{
                  flex: 1, padding: "9px 8px",
                  border: `1px solid ${exp === o.value ? "var(--gold-border)" : "var(--border)"}`,
                  borderRadius: "var(--radius)",
                  background: exp === o.value ? "var(--gold-muted)" : "var(--bg-soft)",
                  cursor: "pointer", transition: "all 0.15s", textAlign: "center",
                }}
              >
                <p style={{ fontSize: 12, fontWeight: 600, color: exp === o.value ? "var(--gold)" : "var(--text-2)", marginBottom: 1 }}>{o.label}</p>
                <p style={{ fontSize: 10, color: "var(--text-3)", fontWeight: 300 }}>{o.sub}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <button type="submit" disabled={disabled} className="btn btn-primary btn-lg"
        style={{ width: "100%", fontSize: 13, padding: "14px 0", letterSpacing: "0.06em" }}>
        {loading
          ? <><div className="spinner-sm" /> Scanning live listings...</>
          : <><Zap size={15} /> Scan for opportunities</>}
      </button>

      {disabled && !loading && (
        <p style={{ textAlign: "center", fontSize: 11, color: "var(--text-3)", marginTop: 8, fontWeight: 300 }}>
          {!skills.length ? "Add at least one skill above to scan" : "Enter your hourly rate to continue"}
        </p>
      )}
    </form>
  );
}
