import Link from "next/link";
import { ChevronRight, DollarSign, Users, Clock, CheckCircle } from "lucide-react";
import type { Opportunity } from "@/lib/types";
import SiftScore from "./SiftScore";

const ACCENT: Record<string, string> = {
  go:    "var(--go)",
  risky: "var(--warn)",
  skip:  "var(--danger)",
};

export default function OpportunityCard({ opp, best, scanId }: { opp: Opportunity; best?: boolean; scanId?: string }) {
  const accent = ACCENT[opp.verdict] ?? "var(--text-3)";
  const href = `/app/opportunity/${opp.id}${scanId ? `?scan=${scanId}` : ""}`;

  return (
    <Link href={href} style={{ display: "block", position: "relative" }}>
      <article className="opp-card" data-verdict={opp.verdict} style={{ borderLeft: `3px solid ${accent}` }}>
        {best && <div className="opp-best">★ Best match</div>}
        <div className="opp-inner" style={{ padding: "18px 20px", gap: 16, alignItems: "center" }}>
          <SiftScore score={opp.sift_score} size="md" />
          <div className="opp-body">
            <div className="opp-tags" style={{ marginBottom: 7 }}>
              <span className={`tag tag-${opp.verdict}`}>{opp.verdict.toUpperCase()}</span>
              <span className="tag tag-platform">{opp.platform}</span>
            </div>
            <p className="opp-title">{opp.title}</p>
            <div className="opp-meta" style={{ marginBottom: opp.reasons[0] ? 8 : 0 }}>
              {opp.budget_max != null && (
                <span className="opp-meta-item" style={{ color: "var(--go)", fontWeight: 500 }}>
                  <DollarSign size={11} color="var(--go)" />
                  {opp.budget_min != null ? `$${opp.budget_min}–$${opp.budget_max}` : `$${opp.budget_max}`}/hr
                </span>
              )}
              {opp.bid_count != null && (
                <span className="opp-meta-item" style={{ color: opp.bid_count > 20 ? "var(--danger)" : "var(--text-2)" }}>
                  <Users size={11} /> {opp.bid_count} bids
                </span>
              )}
              {opp.posted_at && (
                <span className="opp-meta-item">
                  <Clock size={11} /> {timeAgo(opp.posted_at)}
                </span>
              )}
            </div>
            {opp.reasons[0] && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                <CheckCircle size={11} color="var(--go)" style={{ flexShrink: 0, marginTop: 2 }} />
                <p className="opp-reason" style={{ fontSize: 11, color: "var(--text-3)" }}>{opp.reasons[0]}</p>
              </div>
            )}
          </div>
          <ChevronRight size={15} color="var(--border-2)" style={{ flexShrink: 0 }} />
        </div>
        <div className="opp-card-footer" style={{ "--opp-accent": accent } as React.CSSProperties} />
      </article>
    </Link>
  );
}

function timeAgo(ts: string): string {
  try {
    const h = Math.floor((Date.now() - new Date(ts).getTime()) / 3_600_000);
    if (h < 1) return "just now";
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  } catch { return ""; }
}
