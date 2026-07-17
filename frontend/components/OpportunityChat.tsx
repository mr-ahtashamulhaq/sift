import { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Loader2, ChevronDown, ChevronUp, X } from "lucide-react";
import { streamOpportunityChat } from "@/lib/api";
import type { ChatMessage, Opportunity } from "@/lib/types";

const QUICK_PROMPTS = [
  "Write me a full proposal opening",
  "Is my rate competitive for this job?",
  "What's the biggest risk here?",
  "Should I bid given the competition?",
];

interface Props {
  opportunity: Opportunity;
}

export default function OpportunityChat({ opportunity }: Props) {
  const [open, setOpen]           = useState(false);
  const [messages, setMessages]   = useState<ChatMessage[]>([]);
  const [input, setInput]         = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError]         = useState("");
  const bottomRef                 = useRef<HTMLDivElement>(null);
  const inputRef                  = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 80);
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;

    setError("");
    const userMsg: ChatMessage = { role: "user", content: trimmed };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setStreaming(true);

    const assistantMsg: ChatMessage = { role: "assistant", content: "" };
    setMessages(prev => [...prev, assistantMsg]);

    try {
      const ctx = {
        title:          opportunity.title,
        platform:       opportunity.platform,
        sift_score:   opportunity.sift_score,
        verdict:        opportunity.verdict,
        budget_min:     opportunity.budget_min,
        budget_max:     opportunity.budget_max,
        bid_count:      opportunity.bid_count,
        reasons:        opportunity.reasons,
        red_flags:      opportunity.red_flags,
        proposal_angle: opportunity.proposal_angle,
      };

      for await (const chunk of streamOpportunityChat(nextMessages, ctx)) {
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: updated[updated.length - 1].content + chunk,
          };
          return updated;
        });
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Chat failed");
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setStreaming(false);
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  return (
    <div className="opp-chat-wrap">
      {/* Toggle bar */}
      <button
        className="opp-chat-toggle"
        onClick={() => setOpen(v => !v)}
        type="button"
      >
        <MessageSquare size={15} color="var(--gold)" />
        <span>Ask about this opportunity</span>
        <span className="opp-chat-toggle-badge">Groq</span>
        <span style={{ marginLeft: "auto" }}>
          {open ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </span>
      </button>

      {open && (
        <div className="opp-chat-panel">
          {/* Messages */}
          <div className="opp-chat-messages">
            {messages.length === 0 && (
              <div className="opp-chat-empty">
                <p style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 14, fontWeight: 300 }}>
                  Ask anything about this opportunity — proposal tips, rate advice, risk breakdown.
                </p>
                <div className="opp-chat-quick">
                  {QUICK_PROMPTS.map(q => (
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

            {messages.map((m, i) => (
              <div key={i} className={`opp-chat-msg opp-chat-msg-${m.role}`}>
                <div className="opp-chat-bubble">
                  {m.content || (
                    <span style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-3)" }}>
                      <Loader2 size={12} style={{ animation: "spin 0.7s linear infinite" }} />
                      Thinking…
                    </span>
                  )}
                </div>
              </div>
            ))}

            {error && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "var(--danger-bg)", border: "1px solid var(--danger-border)", borderRadius: "var(--radius)", fontSize: 12, color: "var(--danger)" }}>
                {error}
                <button type="button" onClick={() => setError("")} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--danger)", padding: 0, display: "flex" }}>
                  <X size={12} />
                </button>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input row */}
          <div className="opp-chat-input-row">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask a question… (Enter to send)"
              className="opp-chat-input"
              disabled={streaming}
            />
            <button
              type="button"
              onClick={() => send(input)}
              disabled={!input.trim() || streaming}
              className="btn btn-primary opp-chat-send"
            >
              {streaming
                ? <Loader2 size={14} style={{ animation: "spin 0.7s linear infinite" }} />
                : <Send size={14} />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
