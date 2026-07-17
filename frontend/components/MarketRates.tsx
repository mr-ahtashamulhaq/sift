import { TrendingUp } from "lucide-react";
import type { MarketRates } from "@/lib/types";

export default function MarketRatesChart({ rates, userRate }: { rates: MarketRates; userRate?: number }) {
  const ceiling = (userRate ? Math.max(rates.p75_rate, userRate) : rates.p75_rate) * 1.4;
  const pct = (v: number) => `${Math.min(Math.round((v / ceiling) * 100), 100)}%`;

  const bars = [
    { label: "P25", sub: "Entry",  value: rates.p25_rate,    color: "var(--border-2)" },
    { label: "P50", sub: "Median", value: rates.median_rate, color: "var(--gold-dark)" },
    { label: "P75", sub: "Top",    value: rates.p75_rate,    color: "var(--go)" },
    ...(userRate ? [{ label: "You", sub: "Your rate", value: userRate, color: "var(--gold)" }] : []),
  ];

  return (
    <div className="card card-p">
      <div className="row-sb" style={{ marginBottom: 16 }}>
        <div className="row" style={{ gap: 8 }}>
          <TrendingUp size={14} color="var(--gold)" />
          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-1)" }}>Market rates</span>
        </div>
        <span className="tag tag-platform">{rates.skill_tag} · {rates.sample_count} samples</span>
      </div>

      <div className="stack" style={{ gap: 11 }}>
        {bars.map(b => (
          <div key={b.label}>
            <div className="row-sb" style={{ marginBottom: 5 }}>
              <span style={{ fontSize: 11, font: "300 11px/1 Jost, sans-serif", color: "var(--text-2)" }}>
                <span style={{ fontWeight: 600, color: "var(--text-1)", marginRight: 4 }}>{b.label}</span>{b.sub}
              </span>
              <span style={{ fontFamily: "Space Grotesk, Inter, sans-serif", fontSize: 16, fontWeight: 600, color: b.color }}>
                ${b.value}<span style={{ fontFamily: "Jost", fontSize: 10, fontWeight: 300, color: "var(--text-3)" }}>/hr</span>
              </span>
            </div>
            <div className="rate-track">
              <div className="rate-fill" style={{ width: pct(b.value), background: b.color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
