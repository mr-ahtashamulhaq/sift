import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";

const ALL_SKILLS = [
  "React", "TypeScript", "JavaScript", "Python", "Node.js", "Next.js",
  "Vue.js", "Angular", "Svelte", "Django", "FastAPI", "Flask", "Express",
  "GraphQL", "REST API", "PostgreSQL", "MySQL", "MongoDB", "Redis", "AWS",
  "Google Cloud", "Azure", "Docker", "Kubernetes", "DevOps", "CI/CD",
  "Figma", "UI/UX Design", "Tailwind CSS", "SASS", "CSS", "HTML",
  "React Native", "Flutter", "iOS", "Android", "Swift", "Kotlin",
  "SEO", "Copywriting", "Content Writing", "Data Analysis", "Machine Learning",
  "Data Science", "TensorFlow", "PyTorch", "Pandas", "WordPress", "Shopify",
  "Webflow", "Framer", "PHP", "Laravel", "Ruby on Rails", "Go", "Rust",
  "Java", "Spring Boot", "C#", ".NET", "Unity", "Blockchain", "Solidity",
];

interface Props {
  skills: string[];
  onChange: (skills: string[]) => void;
  max?: number;
}

export default function SkillInput({ skills, onChange, max = 15 }: Props) {
  const [input, setInput]         = useState("");
  const [open, setOpen]           = useState(false);
  const [highlighted, setHigh]    = useState(0);
  const wrapRef                   = useRef<HTMLDivElement>(null);

  const filtered = ALL_SKILLS.filter(
    s => s.toLowerCase().includes(input.toLowerCase()) && !skills.includes(s)
  ).slice(0, 8);

  // Also include raw input as first option if it's not in the list and not empty
  const showRaw = input.trim() && !ALL_SKILLS.some(s => s.toLowerCase() === input.toLowerCase().trim()) && !skills.includes(input.trim());
  const options = showRaw ? [input.trim(), ...filtered] : filtered;

  function add(s: string) {
    const t = s.trim();
    if (t && !skills.includes(t) && skills.length < max) {
      onChange([...skills, t]);
    }
    setInput("");
    setOpen(false);
    setHigh(0);
  }

  function remove(s: string) {
    onChange(skills.filter(x => x !== s));
  }

  function handleKey(e: React.KeyboardEvent) {
    if (!open || options.length === 0) {
      if ((e.key === "Enter" || e.key === ",") && input.trim()) {
        e.preventDefault();
        add(input);
      }
      return;
    }
    if (e.key === "ArrowDown") { e.preventDefault(); setHigh(h => Math.min(h + 1, options.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHigh(h => Math.max(h - 1, 0)); }
    else if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(options[highlighted]); }
    else if (e.key === "Escape") { setOpen(false); }
  }

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={wrapRef} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {skills.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {skills.map(s => (
            <span key={s} className="skill-chip">
              {s}
              <button type="button" className="skill-chip-x" onClick={() => remove(s)}>
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div style={{ position: "relative" }}>
        <input
          type="text"
          value={input}
          onChange={e => { setInput(e.target.value); setOpen(true); setHigh(0); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKey}
          placeholder={skills.length >= max ? `Max ${max} skills reached` : "Type a skill..."}
          disabled={skills.length >= max}
          className="input"
        />

        {open && options.length > 0 && (
          <div style={{
            position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 50,
            background: "var(--bg-card)", border: "1px solid var(--border-2)",
            borderRadius: "var(--radius-md)", boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            overflow: "hidden",
          }}>
            {options.map((opt, i) => (
              <button
                key={opt}
                type="button"
                onMouseDown={e => { e.preventDefault(); add(opt); }}
                onMouseEnter={() => setHigh(i)}
                style={{
                  display: "block", width: "100%", textAlign: "left",
                  padding: "9px 12px", fontSize: 13, border: "none", cursor: "pointer",
                  background: i === highlighted ? "var(--bg-hover)" : "transparent",
                  color: i === 0 && showRaw ? "var(--gold)" : "var(--text-1)",
                  transition: "background 0.1s",
                }}
              >
                {i === 0 && showRaw ? `Add "${opt}"` : opt}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
