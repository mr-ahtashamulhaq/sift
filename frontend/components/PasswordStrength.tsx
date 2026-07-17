interface Props { password: string }

type Level = "empty" | "weak" | "fair" | "strong" | "excellent";

function score(p: string): Level {
  if (!p) return "empty";
  let pts = 0;
  if (p.length >= 8)  pts++;
  if (p.length >= 12) pts++;
  if (/[A-Z]/.test(p)) pts++;
  if (/[0-9]/.test(p)) pts++;
  if (/[^A-Za-z0-9]/.test(p)) pts++;
  if (pts <= 1) return "weak";
  if (pts === 2) return "fair";
  if (pts === 3) return "strong";
  return "excellent";
}

const META: Record<Level, { label: string; color: string; bars: number }> = {
  empty:     { label: "",          color: "var(--border)",   bars: 0 },
  weak:      { label: "Weak",      color: "var(--danger)",   bars: 1 },
  fair:      { label: "Fair",      color: "var(--warn)",     bars: 2 },
  strong:    { label: "Strong",    color: "var(--go)",       bars: 3 },
  excellent: { label: "Excellent", color: "#3dab78",         bars: 4 },
};

export default function PasswordStrength({ password }: Props) {
  const level = score(password);
  const { label, color, bars } = META[level];

  if (!password) return null;

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 5 }}>
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            style={{
              flex: 1, height: 3, borderRadius: 999,
              background: i <= bars ? color : "var(--border)",
              transition: "background 0.3s",
            }}
          />
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, color, fontWeight: 500 }}>{label}</span>
        {level === "weak" && (
          <span style={{ fontSize: 10, color: "var(--text-3)", fontWeight: 300 }}>
            Add uppercase, numbers or symbols
          </span>
        )}
        {level === "fair" && (
          <span style={{ fontSize: 10, color: "var(--text-3)", fontWeight: 300 }}>
            Use 12+ characters or add symbols
          </span>
        )}
      </div>
    </div>
  );
}
