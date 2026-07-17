import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import {
  MessageSquare, Send, Loader2, Plus, Trash2,
  CheckCircle, AlertTriangle, DollarSign, Users, Sparkles,
} from "lucide-react";
import AppShell from "@/components/AppShell";
import AuthGuard from "@/components/AuthGuard";
import SiftScore from "@/components/SiftScore";
import { streamOpportunityChat, getOpportunities } from "@/lib/api";
import type { ChatMessage, Opportunity } from "@/lib/types";

// ── Types ────────────────────────────────────────────
interface ChatThread {
  id: string;
  title: string;
  subtitle: string;
  oppId: string | null;
  scanId: string | null;
  opp: Opportunity | null;
  messages: ChatMessage[];
  updatedAt: string;
}

// ── Storage ──────────────────────────────────────────
const STORAGE_KEY = "sb_chat_v1";

function loadThreads(): ChatThread[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}

function saveThreads(threads: ChatThread[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(threads)); } catch {}
}

function timeAgo(iso: string): string {
  try {
    const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60)  return "just now";
    if (s < 3600) return `${Math.floor(s / 60)}m`;
    if (s < 86400) return `${Math.floor(s / 3600)}h`;
    return `${Math.floor(s / 86400)}d`;
  } catch { return ""; }
}

const QUICK_PROMPTS = [
  "Write me a full proposal opening",
  "Is my rate competitive for this job?",
  "What's the biggest risk here?",
  "Should I bid given the competition?",
];

const GENERAL_PROMPTS = [
  "How do I stand out on Upwork?",
  "What's a good hourly rate for React in 2026?",
  "How do I handle a lowball client budget?",
  "What makes a winning proposal opening?",
];

// ── Main page ────────────────────────────────────────
export default function ChatPage() {
  const router = useRouter();
  const [threads, setThreads]       = useState<ChatThread[]>([]);
  const [activeId, setActiveId]     = useState<string | null>(null);
  const [input, setInput]           = useState("");
  const [streaming, setStreaming]   = useState(false);
  const [loadingOpp, setLoadingOpp] = useState(false);
  const [mobileView, setMobileView] = useState<"threads" | "chat">("threads");
  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLTextAreaElement>(null);
  const abortRef   = useRef<AbortController | null>(null);
  const initialized = useRef(false);

  const activeThread = threads.find(t => t.id === activeId) ?? null;

  // ── Load threads from localStorage on mount ──────
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const stored = loadThreads();
    setThreads(stored);

    const { opportunity: oppId, scan: scanId } = router.query as Record<string, string>;

    if (oppId) {
      // Navigate from opportunity page — find or create thread
      const existing = stored.find(t => t.oppId === oppId);
      if (existing) {
        setActiveId(existing.id);
        setMobileView("chat");
        return;
      }
      // Create new thread, fetch opp data
      createThreadForOpp(oppId, scanId, stored);
    } else if (stored.length > 0) {
      setActiveId(stored[0].id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady]);

  async function createThreadForOpp(oppId: string, scanId: string, currentThreads: ChatThread[]) {
    setLoadingOpp(true);
    let opp: Opportunity | null = null;
    try {
      const r = await getOpportunities(scanId);
      opp = r.opportunities.find(o => o.id === oppId) ?? null;
    } catch {}
    finally { setLoadingOpp(false); }

    const thread: ChatThread = {
      id: oppId,
      title: opp?.title ?? "Opportunity",
      subtitle: opp?.platform ?? "job",
      oppId,
      scanId,
      opp,
      messages: [],
      updatedAt: new Date().toISOString(),
    };
    const updated = [thread, ...currentThreads];
    setThreads(updated);
    saveThreads(updated);
    setActiveId(thread.id);
    setMobileView("chat");
  }

  function createGeneralThread() {
    const id = `general_${Date.now()}`;
    const thread: ChatThread = {
      id,
      title: "General Advisor",
      subtitle: "Freelance tips & strategy",
      oppId: null,
      scanId: null,
      opp: null,
      messages: [],
      updatedAt: new Date().toISOString(),
    };
    const updated = [thread, ...threads];
    setThreads(updated);
    saveThreads(updated);
    setActiveId(id);
    setMobileView("chat");
  }

  function deleteThread(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    const updated = threads.filter(t => t.id !== id);
    setThreads(updated);
    saveThreads(updated);
    if (activeId === id) setActiveId(updated[0]?.id ?? null);
  }

  function selectThread(id: string) {
    setActiveId(id);
    setMobileView("chat");
    setTimeout(() => inputRef.current?.focus(), 80);
  }

  // Scroll to bottom when messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeThread?.messages]);

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || streaming || !activeThread) return;

    setInput("");
    const userMsg: ChatMessage = { role: "user", content: trimmed };
    const nextMsgs = [...activeThread.messages, userMsg];

    // Add user message + empty assistant placeholder
    const withUser = threads.map(t =>
      t.id === activeThread.id
        ? { ...t, messages: [...nextMsgs, { role: "assistant" as const, content: "" }], updatedAt: new Date().toISOString() }
        : t
    );
    setThreads(withUser);
    abortRef.current = new AbortController();
    setStreaming(true);

    const ctx = activeThread.opp
      ? {
          title:          activeThread.opp.title,
          platform:       activeThread.opp.platform,
          sift_score:   activeThread.opp.sift_score,
          verdict:        activeThread.opp.verdict,
          budget_min:     activeThread.opp.budget_min,
          budget_max:     activeThread.opp.budget_max,
          bid_count:      activeThread.opp.bid_count,
          reasons:        activeThread.opp.reasons,
          red_flags:      activeThread.opp.red_flags,
          proposal_angle: activeThread.opp.proposal_angle,
        }
      : {};

    try {
      for await (const chunk of streamOpportunityChat(nextMsgs, ctx, abortRef.current.signal)) {
        setThreads(prev => prev.map(t =>
          t.id === activeThread.id
            ? {
                ...t,
                messages: t.messages.map((m, i) =>
                  i === t.messages.length - 1
                    ? { ...m, content: m.content + chunk }
                    : m
                ),
              }
            : t
        ));
      }
    } catch (err) {
      if ((err as Error)?.name !== "AbortError") {
        setThreads(prev => prev.map(t =>
          t.id === activeThread.id
            ? { ...t, messages: t.messages.slice(0, -1) }
            : t
        ));
      }
    } finally {
      abortRef.current = null;
      setStreaming(false);
      setThreads(prev => {
        saveThreads(prev);
        return prev;
      });
    }
  }, [streaming, activeThread, threads]);

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
  }

  const chips = activeThread?.opp ? QUICK_PROMPTS : GENERAL_PROMPTS;

  return (
    <AuthGuard>
      <Head><title>AI Chat — Sift</title></Head>
      <AppShell>
        <div className="chat-page-wrap">

          {/* ── Thread list ── */}
          <div className={`chat-threads-col${mobileView === "chat" ? " chat-mobile-hidden" : ""}`}>
            <div className="chat-threads-hd">
              <span className="chat-threads-title">Conversations</span>
              <button className="chat-new-btn" onClick={createGeneralThread} title="New chat">
                <Plus size={14} />
              </button>
            </div>
            <div className="chat-threads-list">
              {threads.length === 0 && (
                <div className="chat-threads-empty">
                  <p>No conversations yet.</p>
                  <p>Open an opportunity and click &ldquo;Chat about this&rdquo; to start.</p>
                </div>
              )}
              {threads.map(t => {
                const lastMsg = t.messages[t.messages.length - 1];
                const isActive = t.id === activeId;
                const verdict = t.opp?.verdict;
                const dot = verdict === "go" ? "var(--go)" : verdict === "risky" ? "var(--warn)" : verdict === "skip" ? "var(--danger)" : "var(--gold)";
                return (
                  <div
                    key={t.id}
                    className={`chat-thread-item${isActive ? " active" : ""}`}
                    onClick={() => selectThread(t.id)}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, minWidth: 0 }}>
                      <span className="chat-thread-dot" style={{ background: dot }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p className="chat-thread-title">{t.title}</p>
                        <p className="chat-thread-sub">
                          {lastMsg ? lastMsg.content.slice(0, 48) + (lastMsg.content.length > 48 ? "…" : "") : t.subtitle}
                        </p>
                      </div>
                      <span className="chat-thread-time">{timeAgo(t.updatedAt)}</span>
                    </div>
                    <button
                      className="chat-thread-del"
                      onClick={e => deleteThread(t.id, e)}
                      title="Delete"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Context panel ── */}
          {activeThread && (
            <div className={`chat-ctx-col${mobileView === "chat" ? " chat-mobile-hidden" : ""}`}>
              {activeThread.opp ? (
                <OppContext opp={activeThread.opp} />
              ) : (
                <GeneralContext />
              )}
            </div>
          )}

          {/* ── Chat area ── */}
          <div className={`chat-main-col${mobileView === "threads" ? " chat-mobile-hidden" : ""}`}>
            {loadingOpp ? (
              <div className="chat-loading">
                <Loader2 size={22} style={{ animation: "spin 0.7s linear infinite" }} />
                <p>Loading opportunity…</p>
              </div>
            ) : !activeThread ? (
              <div className="chat-empty-state">
                <MessageSquare size={36} color="var(--border-2)" style={{ marginBottom: 16 }} />
                <p style={{ fontSize: 14, color: "var(--text-2)", marginBottom: 6 }}>No conversation selected</p>
                <p style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 300, marginBottom: 20 }}>
                  Open an opportunity and click &ldquo;Chat about this&rdquo;, or start a general chat.
                </p>
                <button className="btn btn-primary" onClick={createGeneralThread}>
                  <Plus size={13} /> New general chat
                </button>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="chat-main-hd">
                  <button
                    className="chat-back-btn"
                    onClick={() => setMobileView("threads")}
                  >
                    ←
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="chat-main-title">{activeThread.title}</p>
                    <p className="chat-main-sub">{activeThread.subtitle}</p>
                  </div>
                  <span className="chat-aiml-badge">Groq</span>
                </div>

                {/* Messages */}
                <div className="chat-messages">
                  {activeThread.messages.length === 0 && (
                    <div className="chat-quick-wrap">
                      <p className="chat-quick-label">
                        {activeThread.opp ? "Ask about this opportunity" : "Ask anything about freelancing"}
                      </p>
                      <div className="chat-quick-chips">
                        {chips.map(q => (
                          <button
                            key={q}
                            type="button"
                            className="opp-chat-chip"
                            onClick={() => send(q)}
                            disabled={streaming}
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeThread.messages.map((m, i) => (
                    <div key={i} className={`chat-msg chat-msg-${m.role}`}>
                      <div className="chat-bubble">
                        {m.content || (
                          <span style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-3)" }}>
                            <Loader2 size={12} style={{ animation: "spin 0.7s linear infinite" }} />
                            Thinking…
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div className="chat-input-row">
                  <textarea
                    ref={inputRef}
                    rows={1}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKey}
                    placeholder="Ask anything… (Enter to send)"
                    className="chat-input"
                    disabled={streaming}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (streaming) { abortRef.current?.abort(); }
                      else { send(input); }
                    }}
                    disabled={!streaming && !input.trim()}
                    className="btn btn-primary chat-send-btn"
                    title={streaming ? "Stop" : "Send"}
                  >
                    {streaming
                      ? <span style={{ width: 10, height: 10, background: "currentColor", borderRadius: 2, flexShrink: 0 }} />
                      : <Send size={14} />}
                  </button>
                </div>
              </>
            )}
          </div>

        </div>
      </AppShell>
    </AuthGuard>
  );
}

// ── Opportunity context panel ────────────────────────
function OppContext({ opp }: { opp: Opportunity }) {
  const vColor  = opp.verdict === "go" ? "var(--go)" : opp.verdict === "risky" ? "var(--warn)" : "var(--danger)";
  const vBg     = opp.verdict === "go" ? "var(--go-bg)" : opp.verdict === "risky" ? "var(--warn-bg)" : "var(--danger-bg)";
  const vBorder = opp.verdict === "go" ? "var(--go-border)" : opp.verdict === "risky" ? "var(--warn-border)" : "var(--danger-border)";

  return (
    <div className="chat-ctx-inner">
      <p className="chat-ctx-label">Opportunity</p>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <SiftScore score={opp.sift_score} size="lg" />
        <div>
          <span style={{ background: vBg, color: vColor, border: `1px solid ${vBorder}`, borderRadius: "var(--radius)", padding: "3px 10px", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            {opp.verdict.toUpperCase()}
          </span>
          <p style={{ fontSize: 9, color: "var(--text-3)", marginTop: 4, fontWeight: 400, letterSpacing: "0.06em", textTransform: "uppercase" }}>{opp.platform}</p>
        </div>
      </div>

      <p className="chat-ctx-title">{opp.title}</p>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        {opp.budget_max != null && (
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--go)", fontWeight: 600 }}>
            <DollarSign size={11} />
            {opp.budget_min ? `$${opp.budget_min}–$${opp.budget_max}` : `$${opp.budget_max}`}/hr
          </span>
        )}
        {opp.bid_count != null && (
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: opp.bid_count > 20 ? "var(--danger)" : "var(--text-3)" }}>
            <Users size={11} />
            {opp.bid_count} bids
          </span>
        )}
      </div>

      {opp.reasons.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <p className="chat-ctx-section-lbl" style={{ color: "var(--go)" }}>
            <CheckCircle size={10} /> Why bid
          </p>
          {opp.reasons.slice(0, 3).map((r, i) => (
            <div key={i} className="chat-ctx-row">
              <CheckCircle size={9} color="var(--go)" style={{ flexShrink: 0, marginTop: 2 }} />
              <p>{r}</p>
            </div>
          ))}
        </div>
      )}

      {opp.red_flags.length > 0 && (
        <div>
          <p className="chat-ctx-section-lbl" style={{ color: "var(--danger)" }}>
            <AlertTriangle size={10} /> Red flags
          </p>
          {opp.red_flags.slice(0, 3).map((f, i) => (
            <div key={i} className="chat-ctx-row">
              <AlertTriangle size={9} color="var(--danger)" style={{ flexShrink: 0, marginTop: 2 }} />
              <p>{f}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── General mode context panel ───────────────────────
function GeneralContext() {
  return (
    <div className="chat-ctx-inner">
      <p className="chat-ctx-label">Mode</p>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: "var(--radius-md)", background: "var(--gold-muted)", border: "1px solid var(--gold-border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Sparkles size={20} color="var(--gold)" />
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>General Advisor</p>
          <p style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 300 }}>Freelance strategy & tips</p>
        </div>
      </div>
      <p style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 300, lineHeight: 1.65 }}>
        Ask about rates, proposal writing, platform strategy, client handling, or anything else about winning more freelance work.
      </p>
      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 6 }}>
        {["Rate negotiation", "Proposal structure", "Platform strategy", "Client red flags"].map(tag => (
          <span key={tag} style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-3)", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--gold)", flexShrink: 0 }} />
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
