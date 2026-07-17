type Size = "sm" | "md" | "lg";

const SIZES: Record<Size, { box: number; r: number; stroke: number; fs: number; lbl: number }> = {
  sm: { box: 56,  r: 22, stroke: 3,   fs: 13, lbl: 8  },
  md: { box: 72,  r: 28, stroke: 3.5, fs: 17, lbl: 9  },
  lg: { box: 96,  r: 38, stroke: 4.5, fs: 22, lbl: 10 },
};

function verdictColor(score: number) {
  if (score >= 70) return { stroke: "#3dab78", text: "#3dab78", label: "GO" };
  if (score >= 45) return { stroke: "#e8a23d", text: "#e8a23d", label: "RISK" };
  return              { stroke: "#e04f3c", text: "#e04f3c", label: "SKIP" };
}

export default function SiftScore({ score, size = "md" }: { score: number; size?: Size }) {
  const { box, r, stroke, fs, lbl } = SIZES[size];
  const c = box / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * Math.min(Math.max(score, 0), 100) / 100;
  const v = verdictColor(score);
  const id = `sg-${size}-${Math.round(score)}`;

  return (
    <svg width={box} height={box} viewBox={`0 0 ${box} ${box}`} style={{ flexShrink: 0 }}>
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={v.stroke} stopOpacity="0.45" />
          <stop offset="100%" stopColor={v.stroke} />
        </linearGradient>
      </defs>
      <circle cx={c} cy={c} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
      <circle
        cx={c} cy={c} r={r} fill="none"
        stroke={`url(#${id})`} strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        transform={`rotate(-90 ${c} ${c})`}
        style={{
          transition: "stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)",
          filter: `drop-shadow(0 0 4px ${v.stroke}66)`,
        }}
      />
      <text x={c} y={c - 1} textAnchor="middle" dominantBaseline="middle"
        fill={v.text} fontSize={fs}
        style={{ fontFamily: "Space Grotesk, Inter, sans-serif", fontWeight: 600 }}>
        {score}
      </text>
      <text x={c} y={c + fs * 0.82} textAnchor="middle" dominantBaseline="middle"
        fill={v.text} fontSize={lbl} opacity="0.8"
        style={{ fontFamily: "Jost, sans-serif", fontWeight: 600, letterSpacing: "0.12em" }}>
        {v.label}
      </text>
    </svg>
  );
}
