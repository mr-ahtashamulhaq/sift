import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { ArrowLeft, CheckCircle, AlertTriangle, XCircle, ExternalLink, DollarSign, Users, Clock, MessageSquare } from "lucide-react";
import AppShell from "@/components/AppShell";
import AuthGuard from "@/components/AuthGuard";
import SiftScore from "@/components/SiftScore";
import MarketRates from "@/components/MarketRates";
import ClientProfile from "@/components/ClientProfile";
import OpportunityChat from "@/components/OpportunityChat";
import { getOpportunities } from "@/lib/api";
import type { Opportunity, MarketRates as MR, ClientProfile as CP } from "@/lib/types";

interface DetailData {
  opp: Opportunity;
  market: MR | null;
  client: CP | null;
}

export default function OpportunityDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [data, setData]       = useState<DetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    if (!id) return;
    const scanId = router.query.scan as string | undefined;
    if (!scanId) { router.replace("/app/history"); return; }
    getOpportunities(scanId)
      .then(r => {
        const opp = r.opportunities.find(o => o.id === id);
        if (!opp) { setError("Opportunity not found"); return; }
        setData({ opp, market: r.market_rates || null, client: null });
      })
      .catch(() => setError("Failed to load opportunity"))
      .finally(() => setLoading(false));
  }, [id, router.query.scan]);

  const verdict  = data?.opp?.verdict ?? "risky";
  const vColor   = verdict === "go" ? "var(--go)"     : verdict === "risky" ? "var(--warn)"   : "var(--danger)";
  const vBg      = verdict === "go" ? "var(--go-bg)"  : verdict === "risky" ? "var(--warn-bg)": "var(--danger-bg)";
  const vBorder  = verdict === "go" ? "var(--go-border)" : verdict === "risky" ? "var(--warn-border)" : "var(--danger-border)";
  const heroBg   = verdict === "go" ? "rgba(16,185,129,0.07)" : verdict === "risky" ? "rgba(245,158,11,0.07)" : "rgba(239,68,68,0.06)";
  const VIcon    = verdict === "go" ? CheckCircle : verdict === "risky" ? AlertTriangle : XCircle;
  const listingUrl = data?.opp ? cleanListingUrl(data.opp.url) : null;

  return (
    <AuthGuard>
      <Head><title>{data?.opp?.title ?? "Opportunity"} — Sift</title></Head>
      <AppShell>
        <div className="page-header">
          <button
            className="btn btn-ghost"
            onClick={() => {
              const scanId = router.query.scan as string | undefined;
              if (scanId) router.push(`/app/scan?id=${scanId}`);
              else router.push("/app/scan");
            }}
            style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}
          >
            <ArrowLeft size={13} /> Back to results
          </button>
          {id && (
            <button
              className="btn btn-primary"
              onClick={() => {
                const scanId = router.query.scan as string | undefined;
                const params = new URLSearchParams({ opportunity: id as string });
                if (scanId) params.set("scan", scanId);
                router.push(`/app/chat?${params.toString()}`);
              }}
              style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, marginLeft: "auto" }}
            >
              <MessageSquare size={13} /> Chat about this
            </button>
          )}
        </div>

        <div className="page-body">
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", paddingTop: 60 }}>
              <div className="spinner" />
            </div>
          ) : error ? (
            <div className="card card-p empty-state">
              <p style={{ color: "var(--danger)", fontSize: 14, marginBottom: 8 }}>{error}</p>
              <Link href="/app/scan"><button className="btn btn-ghost">Start new scan</button></Link>
            </div>
          ) : data ? (
            <div className="stack" style={{ gap: 14 }}>

              {/* ── Cinematic hero ── */}
              <div className="opp-detail-v2">
                {/* Header band */}
                <div className="opp-detail-hd" style={{ "--hero-bg": `linear-gradient(160deg, ${heroBg} 0%, transparent 70%)` } as React.CSSProperties}>
                  <div className="opp-detail-hd-inner">
                    {/* Verdict + platform badges */}
                    <div className="opp-verdict-row">
                      <span style={{ background: vBg, color: vColor, border: `1px solid ${vBorder}`, borderRadius: "var(--radius)", padding: "4px 12px", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 5 }}>
                        <VIcon size={11} /> {verdict.toUpperCase()}
                      </span>
                      <span style={{ background: "rgba(255,255,255,0.05)", color: "var(--text-2)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "4px 12px", fontSize: 11, fontWeight: 400, textTransform: "capitalize" }}>
                        {data.opp.platform}
                      </span>
                      {listingUrl && (
                        <a href={listingUrl} target="_blank" rel="noopener noreferrer" style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--gold)", fontWeight: 500, textDecoration: "none" }}>
                          View listing <ExternalLink size={12} />
                        </a>
                      )}
                    </div>

                    {/* Score + title row */}
                    <div className="opp-detail-score-row">
                      <div className="opp-detail-score-wrap">
                        <SiftScore score={data.opp.sift_score} size="lg" />
                        <span className="opp-detail-score-label">Sift score</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h1 className="opp-detail-title-v2">{data.opp.title}</h1>
                        {/* Meta row */}
                        <div className="opp-detail-meta-row">
                          {data.opp.budget_max != null && (
                            <span className="opp-detail-meta-item" style={{ color: "var(--go)", fontWeight: 600 }}>
                              <DollarSign size={13} color="var(--go)" />
                              {data.opp.budget_min != null ? `$${data.opp.budget_min}–$${data.opp.budget_max}` : `$${data.opp.budget_max}`}/hr
                            </span>
                          )}
                          {data.opp.bid_count != null && (
                            <span className="opp-detail-meta-item" style={{ color: data.opp.bid_count > 20 ? "var(--danger)" : "var(--text-2)" }}>
                              <Users size={13} />
                              {data.opp.bid_count} competing bids
                            </span>
                          )}
                          {data.opp.posted_at && (
                            <span className="opp-detail-meta-item">
                              <Clock size={13} />
                              {timeAgo(data.opp.posted_at)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Reasons + red flags ── */}
                {(data.opp.reasons.length > 0 || data.opp.red_flags.length > 0) && (
                  <div className="opp-detail-insights">
                    {data.opp.reasons.length > 0 && (
                      <div className="insight-col">
                        <div className="insight-col-lbl" style={{ color: "var(--go)" }}>
                          <CheckCircle size={12} color="var(--go)" />
                          Why bid
                        </div>
                        {data.opp.reasons.map((r, i) => (
                          <div key={i} className="insight-row">
                            <div className="insight-ico insight-ico-go">
                              <CheckCircle size={11} color="var(--go)" />
                            </div>
                            <p className="insight-txt">{r}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {data.opp.red_flags.length > 0 && (
                      <div className="insight-col">
                        <div className="insight-col-lbl" style={{ color: "var(--danger)" }}>
                          <AlertTriangle size={12} color="var(--danger)" />
                          Red flags
                        </div>
                        {data.opp.red_flags.map((f, i) => (
                          <div key={i} className="insight-row">
                            <div className="insight-ico insight-ico-danger">
                              <AlertTriangle size={11} color="var(--danger)" />
                            </div>
                            <p className="insight-txt">{f}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Proposal angle */}
              {data.opp.proposal_angle && (
                <div className="proposal-block">
                  <div className="proposal-block-hd">
                    <span className="proposal-block-lbl">How to open your proposal</span>
                    <span className="proposal-block-sub">— paste this as your first line</span>
                  </div>
                  <p className="proposal-block-text">&ldquo;{data.opp.proposal_angle}&rdquo;</p>
                </div>
              )}

              {/* Market rates + client */}
              {data.market && data.client ? (
                <div className="col-2" style={{ alignItems: "flex-start" }}>
                  <MarketRates rates={data.market} />
                  <ClientProfile profile={data.client} />
                </div>
              ) : data.market ? (
                <MarketRates rates={data.market} />
              ) : null}

              {/* AI Chat */}
              <OpportunityChat opportunity={data.opp} />

            </div>
          ) : null}
        </div>
      </AppShell>
    </AuthGuard>
  );
}

function cleanListingUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let url = raw.trim().replace(/^["']+|["']+$/g, "");
  if (!url.startsWith("http")) {
    const match = url.match(/https?:\/\/[^\s"']+/);
    url = match ? match[0] : url;
  }
  return url.startsWith("http") ? url : null;
}

function timeAgo(ts: string): string {
  try {
    const h = Math.floor((Date.now() - new Date(ts).getTime()) / 3_600_000);
    if (h < 1) return "just now";
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  } catch { return ""; }
}
