import { useState, FormEvent } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { Loader2, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { LogoIcon } from "@/components/Logo";
import { useAuth } from "@/lib/auth";
import ThemeToggle from "@/components/ThemeToggle";

export default function Login() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd]   = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      const next = (router.query.next as string) || "/app/dashboard";
      router.push(next);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head><title>Sign in — Sift</title></Head>
      <div className="auth-page">
        <Link href="/" style={{ position: "absolute", top: 16, left: 16, zIndex: 2, display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "var(--text-3)", transition: "color 0.15s" }}
          onMouseEnter={e => (e.currentTarget.style.color = "var(--text-1)")}
          onMouseLeave={e => (e.currentTarget.style.color = "var(--text-3)")}>
          <ArrowLeft size={14} /> Back
        </Link>
        <div style={{ position: "absolute", top: 16, right: 16, zIndex: 2 }}><ThemeToggle /></div>
        <div className="auth-glow" />
        <div className="auth-card">
          <div className="auth-logo">
            <LogoIcon size={40} />
            <span className="auth-logo-text" style={{ color: "var(--text-1)" }}>
              SI<span style={{ color: "var(--gold)" }}>FT</span>
            </span>
          </div>

          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-sub">Sign in to your account to continue</p>

          <form onSubmit={handleSubmit} className="stack">
            <div className="form-group">
              <label className="input-label">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" required className="input" autoFocus />
            </div>
            <div className="form-group">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
                <label className="input-label" style={{ margin: 0 }}>Password</label>
                <Link href="/forgot-password" className="auth-link" style={{ fontSize: 11, fontWeight: 400, letterSpacing: 0, textTransform: "none" }}>
                  Forgot password?
                </Link>
              </div>
              <div style={{ position: "relative" }}>
                <input
                  type={showPwd ? "text" : "password"}
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required className="input"
                  style={{ paddingRight: 40 }}
                />
                <button
                  type="button" onClick={() => setShowPwd(v => !v)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: 0, display: "flex" }}
                >
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ padding: "9px 12px", background: "var(--danger-bg)", border: "1px solid var(--danger-border)", borderRadius: "var(--radius)", fontSize: 12, color: "var(--danger)" }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: "100%", padding: "13px 0", marginTop: 4 }}>
              {loading ? <><Loader2 size={14} style={{ animation: "spin 0.7s linear infinite" }} /> Signing in...</> : "Sign in"}
            </button>
          </form>

          <p className="auth-footer">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="auth-link">Create one free</Link>
          </p>
        </div>
      </div>
    </>
  );
}
