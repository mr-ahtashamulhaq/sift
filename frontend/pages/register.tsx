import { useState, FormEvent } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { Loader2, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { LogoIcon } from "@/components/Logo";
import { useAuth } from "@/lib/auth";
import ThemeToggle from "@/components/ThemeToggle";
import PasswordStrength from "@/components/PasswordStrength";

export default function Register() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [showPwd, setShowPwd]   = useState(false);
  const [showCfm, setShowCfm]   = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (password !== confirm) { setError("Passwords do not match"); return; }
    setError("");
    setLoading(true);
    try {
      await register(email, password, name || undefined);
      router.push("/onboarding");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  const mismatch = confirm.length > 0 && password !== confirm;

  return (
    <>
      <Head><title>Create account — Sift</title></Head>
      <div className="auth-page">
        <Link href="/login" style={{ position: "absolute", top: 16, left: 16, zIndex: 2, display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "var(--text-3)", transition: "color 0.15s" }}
          onMouseEnter={e => (e.currentTarget.style.color = "var(--text-1)")}
          onMouseLeave={e => (e.currentTarget.style.color = "var(--text-3)")}>
          <ArrowLeft size={14} /> Sign in
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

          <h1 className="auth-title">Create your account</h1>
          <p className="auth-sub">Start winning more freelance bids today</p>

          <form onSubmit={handleSubmit} className="stack">
            <div className="form-group">
              <label className="input-label">Display name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="Your name" className="input" autoFocus />
            </div>
            <div className="form-group">
              <label className="input-label">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" required className="input" />
            </div>
            <div className="form-group">
              <label className="input-label">Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPwd ? "text" : "password"}
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="At least 8 characters" required className="input"
                  style={{ paddingRight: 40 }}
                />
                <button
                  type="button" onClick={() => setShowPwd(v => !v)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: 0, display: "flex" }}
                >
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <PasswordStrength password={password} />
            </div>
            <div className="form-group">
              <label className="input-label">Confirm password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showCfm ? "text" : "password"}
                  value={confirm} onChange={e => setConfirm(e.target.value)}
                  placeholder="Repeat your password" required className="input"
                  style={{ paddingRight: 40, borderColor: mismatch ? "var(--danger)" : undefined }}
                />
                <button
                  type="button" onClick={() => setShowCfm(v => !v)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: 0, display: "flex" }}
                >
                  {showCfm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {mismatch && (
                <p style={{ fontSize: 11, color: "var(--danger)", marginTop: 4 }}>Passwords do not match</p>
              )}
            </div>

            {error && (
              <div style={{ padding: "9px 12px", background: "var(--danger-bg)", border: "1px solid var(--danger-border)", borderRadius: "var(--radius)", fontSize: 12, color: "var(--danger)" }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading || mismatch} className="btn btn-primary" style={{ width: "100%", padding: "13px 0", marginTop: 4 }}>
              {loading ? <><Loader2 size={14} style={{ animation: "spin 0.7s linear infinite" }} /> Creating account...</> : "Create account →"}
            </button>
          </form>

          <p className="auth-footer">
            Already have an account?{" "}
            <Link href="/login" className="auth-link">Sign in</Link>
          </p>
        </div>
      </div>
    </>
  );
}
