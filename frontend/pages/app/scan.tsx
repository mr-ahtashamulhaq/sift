import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { SlidersHorizontal, ArrowUpDown, Filter, Zap as ZapIcon, Clock, Brain } from "lucide-react";
import AppShell from "@/components/AppShell";
import AuthGuard from "@/components/AuthGuard";
import ScanForm from "@/components/ScanForm";
import LoadingState from "@/components/LoadingState";
import OpportunityCard from "@/components/OpportunityCard";
import MarketRates from "@/components/MarketRates";
import { useAuth } from "@/lib/auth";
import { useDemo } from "@/lib/demo";
import { startScan, getOpportunities } from "@/lib/api";
import type { Opportunity, MarketRates as MR, ScanRequest } from "@/lib/types";

type Verdict = "go" | "risky" | "skip";
type SortKey = "score" | "rate" | "bids";

const POLL_MS = 1500;

function scanCacheKey(id: string) {
  return `sb_scan_${id}`;
}

function readScanCache(id: string): { opps: Opportunity[]; market: MR | null; status: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(scanCacheKey(id));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { opps: Opportunity[]; market: MR | null; status: string };
    if (parsed.status === "complete") return parsed;
    if (parsed.status === "processing" && parsed.opps.length > 0) return parsed;
    return null;
  } catch {
    return null;
  }
}

function writeScanCache(id: string, opps: Opportunity[], market: MR | null, status: string) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(scanCacheKey(id), JSON.stringify({ opps, market, status }));
  } catch {
    /* ignore quota errors */
  }
}

export default function ScanPage() {
  const { profile } = useAuth();
  const { demo } = useDemo();
  const router = useRouter();
  const resumeId = router.query.id as string | undefined;

  const [scanId, setScanId]         = useState<string | null>(resumeId || null);
  const [status, setStatus]         = useState<string>("idle");
  const [progress, setProgress]     = useState("");
  const [opps, setOpps]             = useState<Opportunity[]>([]);
  const [market, setMarket]         = useState<MR | null>(null);
  const [error, setError]           = useState("");

  const [sortKey, setSortKey]   = useState<SortKey>("score");
  const [sortAsc, setSortAsc]   = useState(false);
  const [filter, setFilter]     = useState<Verdict | "all">("all");
  const [platform, setPlatform] = useState<string>("all");

  const poll = useCallback(async (id: string) => {
    try {
      const r = await getOpportunities(id);
      setProgress(r.message || "");
      if (r.opportunities?.length) {
        setOpps(r.opportunities);
      }
      if (r.status === "complete") {
        setOpps(r.opportunities);
        setMarket(r.market_rates || null);
        setStatus("complete");
        writeScanCache(id, r.opportunities, r.market_rates || null, "complete");
      } else if (r.status === "error") {
        setError(r.message || "Scan failed");
        setStatus("error");
      } else {
        setStatus("processing");
        writeScanCache(id, r.opportunities ?? [], r.market_rates || null, "processing");
        setTimeout(() => poll(id), POLL_MS);
      }
    } catch {
      setError("Failed to fetch results");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    if (!resumeId) return;

    const cached = readScanCache(resumeId);
    if (cached) {
      setScanId(resumeId);
      setOpps(cached.opps);
      setMarket(cached.market);
      setStatus(cached.status);
      if (cached.status === "processing") poll(resumeId);
      return;
    }

    let cancelled = false;
    setScanId(resumeId);

    (async () => {
      try {
        const r = await getOpportunities(resumeId);
        if (cancelled) return;
        setProgress(r.message || "");
        if (r.opportunities?.length) setOpps(r.opportunities);
        if (r.status === "complete") {
          setOpps(r.opportunities);
          setMarket(r.market_rates || null);
          setStatus("complete");
          writeScanCache(resumeId, r.opportunities, r.market_rates || null, "complete");
        } else if (r.status === "error") {
          setError(r.message || "Scan failed");
          setStatus("error");
        } else {
          setStatus("processing");
          poll(resumeId);
        }
      } catch {
        if (!cancelled) {
          setError("Failed to fetch results");
          setStatus("error");
        }
      }
    })();

    return () => { cancelled = true; };
  }, [resumeId, poll]);

  async function handleSubmit(req: ScanRequest) {
    setError("");
    setOpps([]);
    setMarket(null);
    setStatus("processing");

    if (demo) {
      setProgress("Loading demo results...");
      setScanId("demo");
      setTimeout(async () => {
        try {
          const r = await getOpportunities("demo");
          setOpps(r.opportunities);
          setMarket(r.market_rates || null);
          setStatus("complete");
        } catch {
          setError("Failed to load demo data — make sure demo rows are seeded in Supabase.");
          setStatus("error");
        }
      }, 900);
      return;
    }

    setProgress("Starting scan...");
    try {
      const r = await startScan(req);
      setScanId(r.scan_id);
      router.replace({ query: { id: r.scan_id } }, undefined, { shallow: true });
      poll(r.scan_id);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to start scan");
      setStatus("error");
    }
  }

  const platforms = ["all", ...Array.from(new Set(opps.map(o => o.platform))).sort()];

  const visible = opps
    .filter(o => filter === "all" || o.verdict === filter)
    .filter(o => platform === "all" || o.platform === platform)
    .sort((a, b) => {
      let diff = 0;
      if (sortKey === "score") diff = a.sift_score - b.sift_score;
      else if (sortKey === "rate") diff = (a.budget_max ?? 0) - (b.budget_max ?? 0);
      else if (sortKey === "bids") diff = (a.bid_count ?? 999) - (b.bid_count ?? 999);
      return sortAsc ? diff : -diff;
    });

  const goCnt    = opps.filter(o => o.verdict === "go").length;
  const riskyCnt = opps.filter(o => o.verdict === "risky").length;
  const isComplete = status === "complete";

  function renderResults() {
    if (visible.length === 0 && isComplete) {
      return (
        <div className="card card-p empty-state">
          <SlidersHorizontal size={24} color="var(--text-3)" style={{ marginBottom: 10 }} />
          <p style={{ color: "var(--text-2)", fontSize: 13 }}>No results match this filter</p>
        </div>
      );
    }
    if (visible.length === 0) {
      return null;
    }
    return (
      <div className="stack-sm">
        {visible.map((opp, i) => (
          <OpportunityCard key={opp.id} opp={opp} best={i === 0 && filter === "all" && isComplete} scanId={scanId ?? undefined} />
        ))}
      </div>
    );
  }

  return (
    <AuthGuard>
      <Head><title>New Scan — Sift</title></Head>
      <AppShell>
        <div className="page-header">
          <div>
            <h1 style={{ fontFamily: "Space Grotesk, Inter, sans-serif", fontSize: 26, fontWeight: 600, color: "var(--text-1)", marginBottom: 4 }}>
              New Scan
            </h1>
            <p style={{ fontSize: 13, color: "var(--text-3)", fontWeight: 300 }}>
              Live bid intelligence across Upwork, Freelancer, Guru, PeoplePerHour and Toptal
            </p>
          </div>
        </div>

        <div className="page-body">
          {status === "idle" && resumeId ? null : status === "idle" || status === "error" ? (
            <div className="scan-2col">
              {/* Left: form */}
              <div>
                <ScanForm
                  onSubmit={handleSubmit}
                  loading={false}
                  defaultSkills={profile?.skills}
                  defaultRate={profile?.hourly_rate}
                  defaultExp={profile?.experience}
                  defaultGithub={profile?.github_url ?? ""}
                />
                {error && (
                  <div style={{ marginTop: 12, padding: "10px 14px", background: "var(--danger-bg)", border: "1px solid var(--danger-border)", borderRadius: "var(--radius)", fontSize: 12, color: "var(--danger)" }}>
                    {error}
                  </div>
                )}
              </div>

              {/* Right: platform intelligence panel */}
              <div className="scan-panel">
                <div className="scan-panel-hd">
                  <p className="scan-panel-title">5 platforms, live data</p>
                  <p className="scan-panel-sub">Real-time scan across the top freelance marketplaces</p>
                </div>
                {[
                  { name: "Upwork",        tag: "Largest platform" },
                  { name: "Freelancer",    tag: "50M+ projects" },
                  { name: "Guru",          tag: "Vetted clients" },
                  { name: "PeoplePerHour", tag: "EU-focused" },
                  { name: "Toptal",        tag: "Top 3% talent" },
                ].map(p => (
                  <div key={p.name} className="scan-platform-row">
                    <span className="scan-live-dot" />
                    <span className="scan-platform-name">{p.name}</span>
                    <span className="scan-platform-tag">{p.tag}</span>
                  </div>
                ))}
                <div className="scan-panel-footer">
                  <div className="scan-panel-stat">
                    <div className="scan-panel-stat-icon">
                      <ZapIcon size={10} color="var(--gold)" />
                    </div>
                    Listings scraped, extracted &amp; AI-scored
                  </div>
                  <div className="scan-panel-stat">
                    <div className="scan-panel-stat-icon">
                      <Clock size={10} color="var(--text-3)" />
                    </div>
                    Results appear in 15–45 seconds
                  </div>
                  <div className="scan-panel-stat">
                    <div className="scan-panel-stat-icon">
                      <Brain size={10} color="var(--text-3)" />
                    </div>
                    Personalised to your skills &amp; rate
                  </div>
                </div>
              </div>
            </div>
          ) : status === "processing" ? (
            <>
              {opps.length === 0 ? (
                <LoadingState message={progress} />
              ) : (
                <>
                  <LoadingState message={progress} inline foundCount={opps.length} />
                  {renderResults()}
                </>
              )}
            </>
          ) : (
            <>
              {(() => {
                const total = opps.length;
                const skipCnt = total - goCnt - riskyCnt;
                const goPct   = total > 0 ? Math.round(goCnt   / total * 100) : 0;
                const warnPct = total > 0 ? Math.round(riskyCnt / total * 100) : 0;
                const skipPct = 100 - goPct - warnPct;
                return (
                  <div className="scan-sum-v2">
                    <div className="scan-sum-bar">
                      <div style={{ width: `${goPct}%`,   background: "var(--go)",     transition: "width 0.6s ease" }} />
                      <div style={{ width: `${warnPct}%`, background: "var(--warn)",   transition: "width 0.6s ease" }} />
                      <div style={{ width: `${skipPct}%`, background: "var(--danger)", transition: "width 0.6s ease" }} />
                    </div>
                    <div className="scan-sum-body">
                      <div className="sum-v2-col">
                        <span className="sum-v2-n" style={{ color: "var(--text-1)" }}>{total}</span>
                        <span className="sum-v2-l" style={{ color: "var(--text-3)" }}>Found</span>
                      </div>
                      <div className="sum-v2-col">
                        <span className="sum-v2-n" style={{ color: "var(--go)" }}>{goCnt}</span>
                        <span className="sum-v2-l" style={{ color: "var(--go)" }}>GO</span>
                      </div>
                      <div className="sum-v2-col">
                        <span className="sum-v2-n" style={{ color: "var(--warn)" }}>{riskyCnt}</span>
                        <span className="sum-v2-l" style={{ color: "var(--warn)" }}>RISKY</span>
                      </div>
                      <div className="sum-v2-col">
                        <span className="sum-v2-n" style={{ color: "var(--danger)" }}>{skipCnt}</span>
                        <span className="sum-v2-l" style={{ color: "var(--danger)" }}>SKIP</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="controls-row" style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <Filter size={13} color="var(--text-3)" />
                  {(["all", "go", "risky", "skip"] as const).map(v => (
                    <button key={v} className={`filter-pill${filter === v ? ` fp-${v}-active` : ""}`} onClick={() => setFilter(v)}>
                      {v === "all" ? "All" : v.toUpperCase()}
                    </button>
                  ))}
                </div>
                {platforms.length > 2 && (
                  <div style={{ display: "flex", gap: 6 }}>
                    {platforms.map(p => (
                      <button key={p} className={`filter-pill${platform === p ? " fp-platform-active" : ""}`} onClick={() => setPlatform(p)}>
                        {p === "all" ? "All platforms" : p}
                      </button>
                    ))}
                  </div>
                )}
                <div style={{ display: "flex", gap: 5, marginLeft: "auto" }}>
                  <ArrowUpDown size={13} color="var(--text-3)" style={{ alignSelf: "center" }} />
                  {(["score", "rate", "bids"] as SortKey[]).map(k => (
                    <button
                      key={k}
                      className={`sort-btn${sortKey === k ? " sort-btn-active" : ""}`}
                      onClick={() => { if (sortKey === k) setSortAsc(a => !a); else { setSortKey(k); setSortAsc(false); } }}
                    >
                      {k === "score" ? "Score" : k === "rate" ? "Rate" : "Bids"}
                      {sortKey === k && <span style={{ marginLeft: 3, opacity: 0.6 }}>{sortAsc ? "↑" : "↓"}</span>}
                    </button>
                  ))}
                </div>
              </div>

              {market && <div style={{ marginBottom: 20 }}><MarketRates rates={market} userRate={profile?.hourly_rate} /></div>}

              {renderResults()}
            </>
          )}
        </div>
      </AppShell>
    </AuthGuard>
  );
}
