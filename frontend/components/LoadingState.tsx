import { Search, Database, UserCheck, Sparkles, CheckCircle } from "lucide-react";

const STEPS = [
  { Icon: Search,    label: "Searching job boards",   desc: "Live SERP scan across Upwork, Freelancer, Guru, PeoplePerHour & Toptal" },
  { Icon: Database,  label: "Extracting listing data", desc: "Pulling budget, bids, and description from each listing" },
  { Icon: UserCheck, label: "Reading client profiles", desc: "Fetching client spend history and hire rate" },
  { Icon: Sparkles,  label: "AI scoring & ranking",    desc: "Scoring every listing for your win probability against market rates" },
];

function detect(msg: string): number {
  const m = msg.toLowerCase();
  if (m.includes("scor") || m.includes("ai") || m.includes("of ")) return 3;
  if (m.includes("client") || m.includes("profile") || m.includes("unlock")) return 2;
  if (m.includes("scraping") || m.includes("extract") || m.includes("found") || m.includes("detail")) return 1;
  return 0;
}

interface Props {
  message: string;
  inline?: boolean;
  foundCount?: number;
}

export default function LoadingState({ message, inline = false, foundCount = 0 }: Props) {
  const step = detect(message);

  if (inline) {
    return (
      <div
        className="card"
        style={{
          display: "flex", alignItems: "center", gap: 14,
          marginBottom: 16, padding: "14px 18px",
          borderColor: "var(--gold-border)",
          background: "linear-gradient(135deg, var(--gold-muted) 0%, transparent 100%)",
        }}
      >
        <div className="spinner-sm" style={{ flexShrink: 0, borderTopColor: "var(--gold)" }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)", marginBottom: 2 }}>
            {message || "Processing..."}
          </p>
          <p style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 300 }}>
            {foundCount > 0
              ? `${foundCount} ${foundCount === 1 ? "result" : "results"} ready · scan still running`
              : "Live scan in progress · results appear as they score"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          {STEPS.map(({ Icon, label }, i) => {
            const done   = i < step;
            const active = i === step;
            return (
              <div
                key={label} title={label}
                style={{
                  width: 26, height: 26, borderRadius: 7,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: done ? "var(--go-bg)" : active ? "var(--gold)" : "var(--bg-hover)",
                  border: `1px solid ${done ? "var(--go-border)" : active ? "transparent" : "var(--border)"}`,
                  opacity: i > step ? 0.35 : 1,
                  transition: "all 0.25s",
                }}
              >
                {done
                  ? <CheckCircle size={13} color="var(--go)" />
                  : <Icon size={12} color={active ? "#fff" : "var(--text-3)"} />}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const activeStep = STEPS[step];

  return (
    <div className="load-v2">
      <div className="load-v2-bar-wrap">
        <div className="load-v2-bar" />
      </div>
      <div className="load-v2-body">
        <div className="load-v2-icon-wrap">
          <activeStep.Icon size={24} color="var(--gold)" />
        </div>

        <p style={{ textAlign: "center", fontFamily: "Space Grotesk, Inter, sans-serif", fontWeight: 700, fontSize: 20, color: "var(--text-1)", marginBottom: 6, letterSpacing: "-0.02em" }}>
          {message || "Processing..."}
        </p>
        <p style={{ textAlign: "center", fontSize: 12, color: "var(--text-3)", fontWeight: 300, maxWidth: 340, margin: "0 auto" }}>
          {activeStep.desc}
        </p>

        <div className="load-v2-steps">
          {STEPS.map(({ Icon, label }, i) => {
            const done   = i < step;
            const active = i === step;
            return (
              <div key={label} className={`load-v2-step ${done ? "load-v2-step-done" : active ? "load-v2-step-active" : "load-v2-step-idle"}`}>
                <div className={`load-v2-step-ico ${done ? "load-v2-step-ico-done" : active ? "load-v2-step-ico-active" : "load-v2-step-ico-idle"}`}>
                  {done
                    ? <CheckCircle size={14} color="var(--go)" />
                    : <Icon size={13} color={active ? "#fff" : "var(--text-3)"} />}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 12, fontWeight: active ? 600 : 400, color: done ? "var(--go)" : active ? "var(--text-1)" : "var(--text-3)" }}>
                    {label}
                  </p>
                </div>
                {active && (
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--gold)", animation: "pulse-dot 1.2s ease-in-out infinite" }} />
                )}
                {done && (
                  <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", color: "var(--go)", textTransform: "uppercase" }}>Done</span>
                )}
              </div>
            );
          })}
        </div>

        <p style={{ textAlign: "center", fontSize: 11, color: "var(--text-3)", marginTop: 20, fontWeight: 300 }}>
          Powered by Serper · Groq · typically 15–45 seconds
        </p>
      </div>
    </div>
  );
}
