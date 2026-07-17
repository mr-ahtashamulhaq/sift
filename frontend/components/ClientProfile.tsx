import { ShieldCheck, DollarSign, UserCheck, Star, AlertTriangle, Clock } from "lucide-react";
import type { ClientProfile } from "@/lib/types";

function Stat({ Icon, label, value, tone = "neu" }: { Icon: React.ElementType; label: string; value: string; tone?: "pos" | "neg" | "neu" }) {
  return (
    <div className={`stat-tile st-${tone}`}>
      <div className={`stat-lbl stat-lbl-${tone}`} style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <Icon size={9} /> {label}
      </div>
      <p className={`stat-val stat-val-${tone}`}>{value}</p>
    </div>
  );
}

export default function ClientProfileCard({ profile }: { profile: ClientProfile }) {
  const fmt = (n: number) =>
    n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000   ? `$${(n / 1_000).toFixed(0)}k`
    : `$${n}`;

  return (
    <div className="card card-p">
      <div className="row-sb" style={{ marginBottom: 14 }}>
        <div className="row" style={{ gap: 8 }}>
          <ShieldCheck size={14} color="var(--gold)" />
          <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-1)" }}>Client profile</span>
        </div>
        <span className="tag tag-gold" style={{ fontSize: 9, letterSpacing: "0.1em" }}>Web Unlocker</span>
      </div>

      <div className="stat-grid">
        <Stat Icon={DollarSign} label="Spent"      value={fmt(profile.total_spent)}     tone={profile.total_spent > 10000 ? "pos" : "neu"} />
        <Stat Icon={UserCheck}  label="Hire rate"  value={`${profile.hire_rate}%`}       tone={profile.hire_rate >= 70 ? "pos" : profile.hire_rate < 50 ? "neg" : "neu"} />
        <Stat Icon={Star}       label="Reviews"    value={String(profile.review_count)}  tone={profile.review_count >= 10 ? "pos" : "neu"} />
        <Stat Icon={AlertTriangle} label="Disputes" value={String(profile.dispute_count)} tone={profile.dispute_count > 0 ? "neg" : "pos"} />
        {profile.avg_rating > 0 && (
          <Stat Icon={Star} label="Rating" value={`${profile.avg_rating}/5`}
            tone={profile.avg_rating >= 4.5 ? "pos" : profile.avg_rating < 4 ? "neg" : "neu"} />
        )}
        {profile.avg_duration_days > 0 && (
          <Stat Icon={Clock} label="Avg length" value={`${profile.avg_duration_days}d`} />
        )}
      </div>

      {profile.dispute_count > 0 && (
        <div style={{ marginTop: 10, padding: "9px 12px", borderRadius: "var(--radius)",
          background: "var(--danger-bg)", border: "1px solid var(--danger-border)",
          display: "flex", gap: 8, alignItems: "flex-start" }}>
          <AlertTriangle size={12} color="var(--danger)" style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 11, color: "var(--danger)", lineHeight: 1.5, fontWeight: 300 }}>
            {profile.dispute_count} dispute{profile.dispute_count > 1 ? "s" : ""} on record — request milestone payments.
          </p>
        </div>
      )}
    </div>
  );
}
