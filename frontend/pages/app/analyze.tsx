import React, { useState } from "react";
import Head from "next/head";
import { Link2, FileText, Loader2, CheckCircle, AlertTriangle, XCircle, ExternalLink, DollarSign, ArrowLeft } from "lucide-react";
import AppShell from "@/components/AppShell";
import AuthGuard from "@/components/AuthGuard";
import SiftScore from "@/components/SiftScore";
import MarketRates from "@/components/MarketRates";
import ClientProfile from "@/components/ClientProfile";
import { useAuth } from "@/lib/auth";
import { analyzeJob } from "@/lib/api";
import type { AnalysisResponse } from "@/lib/types";

type Mode = "url" | "text";

export default function AnalyzePage() {
  const { profile } = useAuth();
  const [mode, setMode]           = useState<Mode>("url");
  const [url, setUrl]             = useState("");
  const [description, setDesc]    = useState("");
  const [title, setTitle]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState<AnalysisResponse | null>(null);
  const [error, setError]         = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const r = await analyzeJob({
        url:         mode === "url" ? url.trim() || undefined : undefined,
        description: mode === "text" ? description.trim() || undefined : undefined,
        title:       title.trim() || undefined,
        skills:      profile?.skills || [],
        hourly_rate: profile?.hourly_rate || 0,
        experience:  profile?.experience || "mid",
      });
      setResult(r);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = mode === "url" ? !!url.trim() : !!description.trim();

  return (
    <AuthGuard>
      <Head><title>Analyze Job — Sift</title></Head>
      <AppShell>
        <div className="page-header">
          <div>
            <h1 style={{ fontFamily: "Space Grotesk, Inter, sans-serif", fontSize: 26, fontWeight: 600, color: "var(--text-1)", marginBottom: 4 }}>
              Analyze a Job
            </h1>
            <p style={{ fontSize: 13, color: "var(--text-3)", fontWeight: 300 }}>
              Paste a URL or job description — our AI agents will score it against your profile
            </p>
          </div>
        </div>

        <div className="page-body">
          {/* When no result: two-column layout (form + what-you-get panel) */}
          {!result ? (
            <div className="scan-2col">
              {/* Left: form card with toggle embedded */}
              <div>
                <div className="card" style={{ overflow: "hidden" }}>
                  {/* Tab toggle row */}
                  <div style={{ display: "flex", borderBottom: "1px solid var(--border)" }}>
                    <button
                      type="button"
                      onClick={() => setMode("url")}
                      style={{
                        flex: 1, padding: "14px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        background: mode === "url" ? "var(--bg-card)" : "var(--bg-soft)",
                        borderRight: "1px solid var(--border)", border: "none",
                        borderBottom: mode === "url" ? "2px solid var(--gold)" : "2px solid transparent",
                        cursor: "pointer", fontSize: 13, fontWeight: mode === "url" ? 600 : 400,
                        color: mode === "url" ? "var(--text-1)" : "var(--text-3)",
                        transition: "all 0.15s",
                      }}
                    >
                      <Link2 size={14} /> Job URL
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode("text")}
                      style={{
                        flex: 1, padding: "14px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        background: mode === "text" ? "var(--bg-card)" : "var(--bg-soft)",
                        border: "none",
                        borderBottom: mode === "text" ? "2px solid var(--gold)" : "2px solid transparent",
                        cursor: "pointer", fontSize: 13, fontWeight: mode === "text" ? 600 : 400,
                        color: mode === "text" ? "var(--text-1)" : "var(--text-3)",
                        transition: "all 0.15s",
                      }}
                    >
                      <FileText size={14} /> Paste description
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="card-p stack" style={{ background: "var(--bg-card)" }}>
                    {mode === "url" ? (
                      <div className="form-group">
                        <label className="input-label">Job URL</label>
                        <input
                          type="url" value={url} onChange={e => setUrl(e.target.value)}
                          placeholder="https://www.upwork.com/jobs/~..."
                          className="input" autoFocus
                        />
                        <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 6, fontWeight: 300 }}>
                          Supports Upwork, Freelancer, Guru, PeoplePerHour, and Toptal
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="form-group">
                          <label className="input-label">Job title (optional)</label>
                          <input
                            type="text" value={title} onChange={e => setTitle(e.target.value)}
                            placeholder="e.g. Senior React Developer for SaaS Dashboard"
                            className="input"
                          />
                        </div>
                        <div className="form-group">
                          <label className="input-label">Job description</label>
                          <textarea
                            value={description} onChange={e => setDesc(e.target.value)}
                            placeholder="Paste the full job description here..."
                            rows={8} className="input" style={{ resize: "vertical" }}
                            autoFocus
                          />
                        </div>
                      </>
                    )}

                    {!profile?.skills?.length && (
                      <div style={{ padding: "9px 12px", background: "var(--warn-bg)", border: "1px solid var(--warn-border)", borderRadius: "var(--radius)", fontSize: 12, color: "var(--warn)" }}>
                        Add your skills in Settings for a more accurate analysis
                      </div>
                    )}

                    {error && (
                      <div style={{ padding: "9px 12px", background: "var(--danger-bg)", border: "1px solid var(--danger-border)", borderRadius: "var(--radius)", fontSize: 12, color: "var(--danger)" }}>
                        {error}
                      </div>
                    )}

                    <button type="submit" disabled={loading || !canSubmit} className="btn btn-primary" style={{ width: "100%", padding: "13px 0", fontSize: 14 }}>
                      {loading ? (
                        <><Loader2 size={14} style={{ animation: "spin 0.7s linear infinite" }} /> Analyzing...</>
                      ) : "Analyze opportunity"}
                    </button>
                  </form>
                </div>
              </div>

              {/* Right: what you get panel */}
              <div className="scan-panel">
                <div className="scan-panel-hd">
                  <p className="scan-panel-title">What you&apos;ll get</p>
                  <p className="scan-panel-sub">AI analysis personalised to your profile</p>
                </div>
                {[
                  { icon: "⚡", label: "Sift score",      desc: "0–100 win probability" },
                  { icon: "✓",  label: "Verdict",           desc: "Go, Risky, or Skip" },
                  { icon: "💡", label: "Reasons & flags",   desc: "Why to bid or avoid" },
                  { icon: "📈", label: "Market rates",      desc: "P25 / median / P75 /hr" },
                  { icon: "✍️", label: "Proposal opener",   desc: "First line to paste in" },
                ].map(item => (
                  <div key={item.label} className="scan-platform-row">
                    <span style={{ fontSize: 16, lineHeight: 1, width: 22, textAlign: "center", flexShrink: 0 }}>{item.icon}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-1)", marginBottom: 1 }}>{item.label}</p>
                      <p style={{ fontSize: 10, color: "var(--text-3)", fontWeight: 300 }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
                <div className="scan-panel-footer">
                  <div className="scan-panel-stat">
                    <div className="scan-panel-stat-icon"><DollarSign size={10} color="var(--gold)" /></div>
                    Benchmarked against live market data
                  </div>
                  <div className="scan-panel-stat">
                    <div className="scan-panel-stat-icon"><CheckCircle size={10} color="var(--text-3)" /></div>
                    Scored against your skills &amp; rate
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Result: full-width */
            <div>
              <button
                type="button"
                onClick={() => setResult(null)}
                className="btn btn-ghost"
                style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}
              >
                ← Analyze another
              </button>
              <AnalysisResult r={result} />
            </div>
          )}
        </div>
      </AppShell>
    </AuthGuard>
  );
}

function AnalysisResult({ r }: { r: AnalysisResponse }) {
  const VIcon   = r.verdict === "go" ? CheckCircle : r.verdict === "risky" ? AlertTriangle : XCircle;
  const vColor  = r.verdict === "go" ? "var(--go)"     : r.verdict === "risky" ? "var(--warn)"        : "var(--danger)";
  const vBg     = r.verdict === "go" ? "var(--go-bg)"  : r.verdict === "risky" ? "var(--warn-bg)"     : "var(--danger-bg)";
  const vBorder = r.verdict === "go" ? "var(--go-border)" : r.verdict === "risky" ? "var(--warn-border)" : "var(--danger-border)";
  const heroBg  = r.verdict === "go" ? "rgba(16,185,129,0.07)" : r.verdict === "risky" ? "rgba(245,158,11,0.07)" : "rgba(239,68,68,0.06)";

  return (
    <div className="stack" style={{ marginTop: 24 }}>
      {/* Cinematic hero — mirrors opp-detail-v2 */}
      <div className="opp-detail-v2">
        <div className="opp-detail-hd" style={{ "--hero-bg": `linear-gradient(160deg, ${heroBg} 0%, transparent 70%)` } as React.CSSProperties}>
          <div className="opp-detail-hd-inner">
            {/* Verdict + platform + link row */}
            <div className="opp-verdict-row">
              <span style={{ background: vBg, color: vColor, border: `1px solid ${vBorder}`, borderRadius: "var(--radius)", padding: "4px 12px", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 5 }}>
                <VIcon size={11} /> {r.verdict.toUpperCase()}
              </span>
              <span style={{ background: "rgba(255,255,255,0.05)", color: "var(--text-2)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "4px 12px", fontSize: 11, fontWeight: 400, textTransform: "capitalize" }}>
                {r.opportunity.platform}
              </span>
              {r.opportunity.url && (
                <a href={r.opportunity.url} target="_blank" rel="noopener noreferrer" style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--gold)", fontWeight: 500, textDecoration: "none" }}>
                  View listing <ExternalLink size={12} />
                </a>
              )}
            </div>

            {/* Score + title */}
            <div className="opp-detail-score-row">
              <div className="opp-detail-score-wrap">
                <SiftScore score={r.sift_score} size="lg" />
                <span className="opp-detail-score-label">Sift score</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 className="opp-detail-title-v2">{r.opportunity.title || "Analyzed opportunity"}</h2>
                {r.opportunity.budget_max != null && (
                  <div className="opp-detail-meta-row">
                    <span className="opp-detail-meta-item" style={{ color: "var(--go)", fontWeight: 600 }}>
                      <DollarSign size={13} color="var(--go)" />
                      {r.opportunity.budget_min != null
                        ? `$${r.opportunity.budget_min}–$${r.opportunity.budget_max}`
                        : `$${r.opportunity.budget_max}`}/hr
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Reasons + red flags grid */}
        {(r.reasons.length > 0 || r.red_flags.length > 0) && (
          <div className="opp-detail-insights">
            {r.reasons.length > 0 && (
              <div className="insight-col">
                <div className="insight-col-lbl" style={{ color: "var(--go)" }}>
                  <CheckCircle size={12} color="var(--go)" /> Why bid
                </div>
                {r.reasons.map((reason, i) => (
                  <div key={i} className="insight-row">
                    <div className="insight-ico insight-ico-go">
                      <CheckCircle size={11} color="var(--go)" />
                    </div>
                    <p className="insight-txt">{reason}</p>
                  </div>
                ))}
              </div>
            )}
            {r.red_flags.length > 0 && (
              <div className="insight-col">
                <div className="insight-col-lbl" style={{ color: "var(--danger)" }}>
                  <AlertTriangle size={12} color="var(--danger)" /> Red flags
                </div>
                {r.red_flags.map((flag, i) => (
                  <div key={i} className="insight-row">
                    <div className="insight-ico insight-ico-danger">
                      <AlertTriangle size={11} color="var(--danger)" />
                    </div>
                    <p className="insight-txt">{flag}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Proposal angle */}
      {r.proposal_angle && (
        <div className="proposal-block">
          <div className="proposal-block-hd">
            <span className="proposal-block-lbl">How to open your proposal</span>
            <span className="proposal-block-sub">— paste this as your first line</span>
          </div>
          <p className="proposal-block-text">&ldquo;{r.proposal_angle}&rdquo;</p>
        </div>
      )}

      {/* Market rates + client profile */}
      {r.market_rates && r.client_profile ? (
        <div className="col-2" style={{ alignItems: "flex-start" }}>
          <MarketRates rates={r.market_rates} />
          <ClientProfile profile={r.client_profile} />
        </div>
      ) : r.market_rates ? (
        <MarketRates rates={r.market_rates} />
      ) : r.client_profile ? (
        <ClientProfile profile={r.client_profile} />
      ) : null}
    </div>
  );
}
