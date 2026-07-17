import { useState, FormEvent } from "react";
import Head from "next/head";
import Link from "next/link";
import { Loader2, Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { LogoIcon } from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import { forgotPassword } from "@/lib/api";

export default function ForgotPassword() {
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head><title>Reset password — Sift</title></Head>
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

          {sent ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 52, height: 52, borderRadius: "var(--radius-md)", background: "var(--go-bg)", border: "1px solid var(--go-border)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <CheckCircle size={24} color="var(--go)" />
              </div>
              <h1 className="auth-title" style={{ marginBottom: 10 }}>Check your inbox</h1>
              <p className="auth-sub" style={{ marginBottom: 28 }}>
                We sent a reset link to <strong style={{ color: "var(--text-1)", fontWeight: 500 }}>{email}</strong>.
                Check your spam folder if it doesn&apos;t arrive within a minute.
              </p>
              <Link href="/login">
                <button className="btn btn-primary" style={{ width: "100%", padding: "13px 0" }}>
                  Back to sign in
                </button>
              </Link>
            </div>
          ) : (
            <>
              <div style={{ width: 52, height: 52, borderRadius: "var(--radius-md)", background: "var(--gold-muted)", border: "1px solid var(--gold-border)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <Mail size={22} color="var(--gold)" />
              </div>
              <h1 className="auth-title">Reset your password</h1>
              <p className="auth-sub">
                Enter your email and we&apos;ll send you a link to set a new password.
              </p>

              <form onSubmit={handleSubmit} className="stack" style={{ marginTop: 24 }}>
                <div className="form-group">
                  <label className="input-label">Email address</label>
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com" required className="input" autoFocus
                  />
                </div>

                {error && (
                  <div style={{ padding: "9px 12px", background: "var(--danger-bg)", border: "1px solid var(--danger-border)", borderRadius: "var(--radius)", fontSize: 12, color: "var(--danger)" }}>
                    {error}
                  </div>
                )}

                <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: "100%", padding: "13px 0" }}>
                  {loading ? <><Loader2 size={14} style={{ animation: "spin 0.7s linear infinite" }} /> Sending...</> : "Send reset link"}
                </button>
              </form>

              <p className="auth-footer">
                <Link href="/login" className="auth-link" style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <ArrowLeft size={12} /> Back to sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}
