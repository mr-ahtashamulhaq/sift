import Head from "next/head";
import Link from "next/link";
import { WifiOff, Zap } from "lucide-react";

export default function Offline() {
  return (
    <>
      <Head>
        <title>Offline — Sift</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div className="auth-page">
        <div className="auth-glow" />
        <div className="auth-card" style={{ textAlign: "center" }}>
          <div className="auth-logo" style={{ justifyContent: "center" }}>
            <div className="auth-logo-icon"><Zap size={18} color="#fff" /></div>
            <span className="auth-logo-text" style={{ color: "var(--text-1)" }}>
              SI<span style={{ color: "var(--gold)" }}>FT</span>
            </span>
          </div>
          <WifiOff size={40} color="var(--text-3)" style={{ margin: "24px auto 16px" }} />
          <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>You&apos;re offline</h1>
          <p style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.6, marginBottom: 24 }}>
            Check your connection and try again. Cached pages may still be available.
          </p>
          <Link href="/" className="btn btn-primary" style={{ display: "inline-flex" }}>
            Go home
          </Link>
        </div>
      </div>
    </>
  );
}
