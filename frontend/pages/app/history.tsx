import React, { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { Clock, ChevronRight, Zap, CheckCircle, AlertTriangle } from "lucide-react";
import AppShell from "@/components/AppShell";
import AuthGuard from "@/components/AuthGuard";
import { getUserScans } from "@/lib/api";
import type { Scan } from "@/lib/types";

function groupByDate(scans: Scan[]): { label: string; items: Scan[] }[] {
  const groups: Record<string, Scan[]> = {};
  for (const s of scans) {
    const d = new Date(s.created_at);
    const now = new Date();
    let label: string;
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
    if (diffDays === 0) label = "Today";
    else if (diffDays === 1) label = "Yesterday";
    else if (diffDays < 7) label = `${diffDays} days ago`;
    else label = d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    (groups[label] ??= []).push(s);
  }
  return Object.entries(groups).map(([label, items]) => ({ label, items }));
}

const SCANS_KEY = "sb_scans_v1";
const SCANS_TTL = 30_000;

export default function HistoryPage() {
  const [scans, setScans]     = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    try {
      const cached = JSON.parse(localStorage.getItem(SCANS_KEY) || "null");
      if (cached?.data) {
        setScans(cached.data);
        setLoading(false);
        if (Date.now() - cached.ts < SCANS_TTL) return;
      }
    } catch {}
    getUserScans()
      .then(r => {
        setScans(r.scans);
        try { localStorage.setItem(SCANS_KEY, JSON.stringify({ ts: Date.now(), data: r.scans })); } catch {}
      })
      .catch(() => setError("Failed to load scan history"))
      .finally(() => setLoading(false));
  }, []);

  const groups = groupByDate(scans);

  return (
    <AuthGuard>
      <Head><title>History — Sift</title></Head>
      <AppShell>
        <div className="page-header">
          <div>
            <h1 style={{ fontFamily: "Space Grotesk, Inter, sans-serif", fontSize: 26, fontWeight: 600, color: "var(--text-1)", marginBottom: 4 }}>
              Scan History
            </h1>
            {!loading && scans.length > 0 && (() => {
              const complete   = scans.filter(s => s.status === "complete").length;
              const processing = scans.filter(s => s.status === "processing").length;
              const failed     = scans.length - complete - processing;
              return (
                <div className="history-header-stats">
                  <span className="hist-stat">
                    <span className="hist-stat-dot" style={{ background: "var(--go)" }} />
                    <span style={{ color: "var(--go)", fontWeight: 600 }}>{complete}</span>
                    <span style={{ color: "var(--text-3)" }}>complete</span>
                  </span>
                  {processing > 0 && (
                    <span className="hist-stat">
                      <span className="hist-stat-dot" style={{ background: "var(--warn)" }} />
                      <span style={{ color: "var(--warn)", fontWeight: 600 }}>{processing}</span>
                      <span style={{ color: "var(--text-3)" }}>processing</span>
                    </span>
                  )}
                  {failed > 0 && (
                    <span className="hist-stat">
                      <span className="hist-stat-dot" style={{ background: "var(--danger)" }} />
                      <span style={{ color: "var(--danger)", fontWeight: 600 }}>{failed}</span>
                      <span style={{ color: "var(--text-3)" }}>failed</span>
                    </span>
                  )}
                  <span style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 300 }}>
                    · {scans.length} total
                  </span>
                </div>
              );
            })()}
            {(loading || scans.length === 0) && (
              <p style={{ fontSize: 13, color: "var(--text-3)", fontWeight: 300 }}>
                {loading ? "Loading..." : "No scans yet"}
              </p>
            )}
          </div>
          <Link href="/app/scan">
            <button className="btn btn-primary">New scan <Zap size={13} /></button>
          </Link>
        </div>

        <div className="page-body">
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", paddingTop: 60 }}>
              <div className="spinner" />
            </div>
          ) : error ? (
            <div className="card card-p empty-state">
              <p style={{ color: "var(--danger)", fontSize: 13 }}>{error}</p>
            </div>
          ) : scans.length === 0 ? (
            <div className="card card-p empty-state">
              <Clock size={32} color="var(--text-3)" style={{ marginBottom: 14 }} />
              <p style={{ color: "var(--text-2)", fontSize: 15, marginBottom: 6 }}>No scans yet</p>
              <p style={{ color: "var(--text-3)", fontSize: 12, fontWeight: 300, marginBottom: 18 }}>
                Your scan history will appear here after your first run
              </p>
              <Link href="/app/scan">
                <button className="btn btn-primary">Start your first scan</button>
              </Link>
            </div>
          ) : (
            <div className="stack">
              {groups.map(({ label, items }) => (
                <div key={label}>
                  <p className="hist-grp-lbl">{label}</p>
                  <div className="stack-sm">
                    {items.map(scan => <ScanHistoryRow key={scan.id} scan={scan} />)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </AppShell>
    </AuthGuard>
  );
}

function ScanHistoryRow({ scan }: { scan: Scan }) {
  const isComplete  = scan.status === "complete";
  const isProcessing = scan.status === "processing";
  const accent = isComplete ? "var(--go)" : isProcessing ? "var(--warn)" : "var(--danger)";
  const statusColor  = isComplete ? "var(--go)" : isProcessing ? "var(--warn)" : "var(--danger)";
  const statusBg     = isComplete ? "var(--go-bg)" : isProcessing ? "var(--warn-bg)" : "var(--danger-bg)";
  const statusBorder = isComplete ? "var(--go-border)" : isProcessing ? "var(--warn-border)" : "var(--danger-border)";
  return (
    <Link href={`/app/scan?id=${scan.id}`} style={{ display: "block", textDecoration: "none" }}>
      <div className="scan-row-v2" style={{ "--row-accent": accent } as React.CSSProperties}>
        <div style={{ width: 38, height: 38, borderRadius: "var(--radius)", background: isComplete ? "var(--go-bg)" : "var(--gold-muted)", border: `1px solid ${isComplete ? "var(--go-border)" : "var(--gold-border)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Zap size={15} color={isComplete ? "var(--go)" : "var(--gold)"} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-1)", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {scan.skills?.join(", ") || "No skills"}
          </p>
          <div style={{ display: "flex", gap: 10, fontSize: 11, color: "var(--text-3)", fontWeight: 300 }}>
            <span>${scan.hourly_rate}/hr</span>
            <span style={{ textTransform: "capitalize" }}>{scan.experience}</span>
            <span>{new Date(scan.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: statusColor, background: statusBg, border: `1px solid ${statusBorder}`, borderRadius: "var(--radius)", padding: "3px 9px", flexShrink: 0 }}>
          {scan.status}
        </span>
        <ChevronRight size={13} color="var(--border-2)" style={{ flexShrink: 0 }} />
      </div>
    </Link>
  );
}
