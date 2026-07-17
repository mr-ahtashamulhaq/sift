import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  Zap, LayoutDashboard, Search, FileText, Clock, MessageSquare,
  Settings, LogOut, ChevronRight, Sun, Moon, Menu, X,
} from "lucide-react";
import { LogoIcon } from "@/components/Logo";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { useDemo } from "@/lib/demo";

const NAV = [
  { href: "/app/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/app/scan",      icon: Search,          label: "Scan" },
  { href: "/app/analyze",   icon: FileText,         label: "Analyze" },
  { href: "/app/history",   icon: Clock,            label: "History" },
  { href: "/app/chat",      icon: MessageSquare,    label: "AI Chat" },
  { href: "/app/settings",  icon: Settings,         label: "Settings" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, profile, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const { demo, toggle: toggleDemo } = useDemo();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleLogout() {
    logout();
    router.push("/login");
  }

  const initials = (profile?.display_name || user?.email || "U")
    .split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="app-shell">
      {/* ── Desktop sidebar ───────────────────── */}
      <aside className={`sidebar${mobileOpen ? " sidebar-mobile-open" : ""}`}>
        <div className="sidebar-logo" style={{ justifyContent: "space-between" }}>
          <Link href="/app/dashboard" style={{ display: "flex", alignItems: "center", gap: 10 }} onClick={() => setMobileOpen(false)}>
            <LogoIcon size={32} />
            <span className="sidebar-wordmark">SI<span className="sidebar-accent">FT</span></span>
          </Link>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button onClick={toggle} title="Toggle theme"
              style={{ background: "none", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 5, cursor: "pointer", color: "var(--text-3)", display: "flex", alignItems: "center" }}>
              {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
            </button>
            <button className="sidebar-close-btn" onClick={() => setMobileOpen(false)}>
              <X size={16} />
            </button>
          </div>
        </div>

        <nav className="sidebar-nav">
          <p className="nav-section-label">Workspace</p>
          {NAV.slice(0, 5).map(({ href, icon: Icon, label }) => {
            const active = router.pathname === href;
            return (
              <Link key={href} href={href} className={`nav-link${active ? " active" : ""}`} onClick={() => setMobileOpen(false)}>
                <Icon size={15} className="nav-link-icon" />
                {label}
                {active && <ChevronRight size={12} style={{ marginLeft: "auto", opacity: 0.5 }} />}
              </Link>
            );
          })}
          <p className="nav-section-label" style={{ marginTop: 12 }}>Account</p>
          <Link href="/app/settings" className={`nav-link${router.pathname === "/app/settings" ? " active" : ""}`} onClick={() => setMobileOpen(false)}>
            <Settings size={15} className="nav-link-icon" />
            Settings
          </Link>
        </nav>

        <div className="sidebar-bottom">
          <div className="user-chip" onClick={handleLogout} title="Sign out">
            <div className="user-avatar">{initials}</div>
            <div className="user-info">
              <p className="user-name">{profile?.display_name || user?.email?.split("@")[0] || "User"}</p>
              <p className="user-email">{user?.email || ""}</p>
            </div>
            <LogOut size={13} color="var(--text-3)" style={{ flexShrink: 0, marginLeft: "auto" }} />
          </div>
          <button
            onClick={toggleDemo}
            title={demo ? "Exit demo mode" : "Enter demo mode"}
            style={{
              marginTop: 6, width: "100%", display: "flex", alignItems: "center", gap: 7,
              background: demo ? "var(--gold-muted)" : "transparent",
              border: `1px solid ${demo ? "var(--gold-border)" : "transparent"}`,
              borderRadius: "var(--radius)", padding: "5px 10px", cursor: "pointer",
              fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase",
              color: demo ? "var(--gold)" : "var(--text-3)", transition: "all 0.15s",
            }}
          >
            <span style={{ width: 5, height: 5, borderRadius: "50%", flexShrink: 0, background: demo ? "var(--gold)" : "var(--text-3)", transition: "background 0.15s" }} />
            {demo ? "Demo on" : "Demo"}
          </button>
        </div>
      </aside>

      {/* ── Mobile overlay ────────────────────── */}
      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}

      {/* ── Mobile top bar ────────────────────── */}
      <div className="mobile-topbar">
        <Link href="/app/dashboard" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <LogoIcon size={28} />
          <span className="sidebar-wordmark" style={{ fontSize: 15 }}>SI<span className="sidebar-accent">FT</span></span>
        </Link>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={toggle} style={{ background: "none", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 5, cursor: "pointer", color: "var(--text-3)", display: "flex" }}>
            {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          <button className="mobile-menu-btn" onClick={() => setMobileOpen(true)}>
            <Menu size={18} />
          </button>
        </div>
      </div>

      <main className="app-content">
        <div className="app-bg-glow" aria-hidden="true" />
        {children}
      </main>

      {/* ── Mobile bottom nav ─────────────────── */}
      <nav className="mobile-bottom-nav">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = router.pathname === href;
          return (
            <Link key={href} href={href} className={`mobile-nav-item${active ? " active" : ""}`}>
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
