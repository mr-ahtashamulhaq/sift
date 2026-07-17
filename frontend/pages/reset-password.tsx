import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { Loader2, Eye, EyeOff, CheckCircle, AlertTriangle } from "lucide-react";
import { LogoIcon } from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import PasswordStrength from "@/components/PasswordStrength";
import { resetPassword } from "@/lib/api";

export default function ResetPassword() {
  const router = useRouter();
  const [token, setToken]       = useState("");
  const [tokenError, setTokenError] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [showPwd, setShowPwd]   = useState(false);
  const [showCfm, setShowCfm]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [done, setDone]         = useState(false);

  useEffect(() => {
    // Supabase puts the token in the URL hash: #access_token=...&type=recovery
    // or as query param: ?access_token=...&type=recovery
    if (typeof window === "undefined") return;

    const hash = window.location.hash.slice(1);
    const hashParams = new URLSearchParams(hash);
    const queryParams = new URLSearchParams(window.location.search);

    const t = hashParams.get("access_token") || queryParams.get("access_token") || (router.query.access_token as string);
    const type = hashParams.get("type") || queryParams.get("type");

    if (t && (type === "recovery" || type === null)) {
      setToken(t);
    } else if (hash || router.isReady) {
      setTokenError(true);
    }
  }, [router.isReady, router.query]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (password !== confirm) { setError("Passwords do not match"); return; }
    setError("");
    setLoading(true);
    try {
      await resetPassword(token, password);
      setDone(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Password reset failed");
    } finally {
      setLoading(false);
    }
  }

  const mismatch = confirm.length > 0 && password !== confirm;

  return (
    <>
      <Head><title>Set new password — Sift</title></Head>
      <div className="auth-page">
        <div style={{ position: "absolute", top: 16, right: 16, zIndex: 2 }}><ThemeToggle /></div>
        <div className="auth-glow" />
        <div className="auth-card">
          <div className="auth-logo">
            <LogoIcon size={40} />
            <span className="auth-logo-text" style={{ color: "var(--text-1)" }}>
              SI<span style={{ color: "var(--gold)" }}>FT</span>
            </span>
          </div>

          {done ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 52, height: 52, borderRadius: "var(--radius-md)", background: "var(--go-bg)", border: "1px solid var(--go-border)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <CheckCircle size={24} color="var(--go)" />
              </div>
              <h1 className="auth-title" style={{ marginBottom: 10 }}>Password updated</h1>
              <p className="auth-sub">Redirecting you to sign in...</p>
            </div>
          ) : tokenError ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 52, height: 52, borderRadius: "var(--radius-md)", background: "var(--danger-bg)", border: "1px solid var(--danger-border)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <AlertTriangle size={24} color="var(--danger)" />
              </div>
              <h1 className="auth-title" style={{ marginBottom: 10 }}>Link expired</h1>
              <p className="auth-sub" style={{ marginBottom: 24 }}>
                This reset link is invalid or has expired. Request a new one.
              </p>
              <Link href="/forgot-password">
                <button className="btn btn-primary" style={{ width: "100%", padding: "13px 0" }}>
                  Request new link
                </button>
              </Link>
            </div>
          ) : (
            <>
              <h1 className="auth-title">Set new password</h1>
              <p className="auth-sub">Choose a strong password for your account.</p>

              <form onSubmit={handleSubmit} className="stack" style={{ marginTop: 24 }}>
                <div className="form-group">
                  <label className="input-label">New password</label>
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
                  <label className="input-label">Confirm new password</label>
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

                <button type="submit" disabled={loading || !token || mismatch} className="btn btn-primary" style={{ width: "100%", padding: "13px 0" }}>
                  {loading ? <><Loader2 size={14} style={{ animation: "spin 0.7s linear infinite" }} /> Updating...</> : "Set new password"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
}
