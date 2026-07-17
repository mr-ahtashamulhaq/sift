import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/theme";

export default function ThemeToggle({ style }: { style?: React.CSSProperties }) {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      title={theme === "dark" ? "Light mode" : "Dark mode"}
      style={{
        background: "none",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        padding: "7px",
        cursor: "pointer",
        color: "var(--text-3)",
        display: "flex",
        alignItems: "center",
        transition: "var(--tr-fast)",
        ...style,
      }}
      onMouseEnter={e => (e.currentTarget.style.color = "var(--gold)")}
      onMouseLeave={e => (e.currentTarget.style.color = "var(--text-3)")}
    >
      {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  );
}
