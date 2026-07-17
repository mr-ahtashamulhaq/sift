import type {
  OpportunitiesResponse, AnalysisResponse,
  ScanRequest, UserProfile, Suggestion, ChatMessage,
} from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("sb_token");
}

async function apiFetch<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers as Record<string, string> | undefined),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let r: Response;
  try {
    r = await fetch(`${BASE}${path}`, { ...opts, headers });
  } catch {
    throw new Error(
      `Cannot reach the API at ${BASE}. Make sure the backend is running (uvicorn on port 8000).`
    );
  }
  if (!r.ok) {
    if (r.status === 401) {
      localStorage.removeItem("sb_token");
      if (typeof window !== "undefined") window.location.href = "/login";
    }
    const err = await r.json().catch(() => ({ detail: r.statusText }));
    throw new Error((err as { detail?: string }).detail || "Request failed");
  }
  return r.json() as Promise<T>;
}

export async function register(email: string, password: string, display_name?: string) {
  return apiFetch<{ access_token: string; user: { id: string; email: string } }>(
    "/auth/register", { method: "POST", body: JSON.stringify({ email, password, display_name }) }
  );
}

export async function login(email: string, password: string) {
  return apiFetch<{ access_token: string; refresh_token: string; user: { id: string; email: string } }>(
    "/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }
  );
}

export async function getProfile(): Promise<UserProfile> {
  return apiFetch("/users/me");
}

export async function updateProfile(data: Partial<UserProfile>): Promise<UserProfile> {
  return apiFetch("/users/me", { method: "PUT", body: JSON.stringify(data) });
}

export async function startScan(r: ScanRequest) {
  return apiFetch<{ scan_id: string; status: string }>("/scan", { method: "POST", body: JSON.stringify(r) });
}

export async function getOpportunities(scan_id: string): Promise<OpportunitiesResponse> {
  return apiFetch(`/opportunities/${scan_id}`);
}

export async function getDemoOpportunities(): Promise<OpportunitiesResponse> {
  return apiFetch("/opportunities/demo");
}

export async function analyzeOpportunity(id: string): Promise<AnalysisResponse> {
  return apiFetch(`/analyze/${id}`, { method: "POST" });
}

export async function analyzeJob(body: {
  url?: string; description?: string; title?: string;
  skills: string[]; hourly_rate: number; experience: string;
}): Promise<AnalysisResponse> {
  return apiFetch("/jobs/analyze", { method: "POST", body: JSON.stringify(body) });
}

export async function getSuggestions(body: {
  skills: string[]; experience: string; hourly_rate: number;
  current_score?: number; target_score?: number; github_url?: string;
}): Promise<{ suggestions: Suggestion[] }> {
  return apiFetch("/suggestions", { method: "POST", body: JSON.stringify(body) });
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  return apiFetch("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) });
}

export async function resetPassword(access_token: string, new_password: string): Promise<{ message: string }> {
  return apiFetch("/auth/reset-password", { method: "POST", body: JSON.stringify({ access_token, new_password }) });
}

export async function getUserScans(): Promise<{ scans: import("./types").Scan[] }> {
  return apiFetch("/scans/history");
}

export async function testSerp(q: string) {
  return apiFetch<{ count: number; results: unknown[] }>(`/test/serp?q=${encodeURIComponent(q)}`);
}

export async function* streamOpportunityChat(
  messages: ChatMessage[],
  opportunityContext: Record<string, unknown>,
  signal?: AbortSignal
): AsyncGenerator<string> {
  const token = getToken();
  const r = await fetch(`${BASE}/chat/opportunity`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ messages, opportunity_context: opportunityContext }),
    signal,
  });

  if (!r.ok) throw new Error("Chat request failed");

  const reader = r.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") return;
      try {
        const parsed = JSON.parse(data) as { text?: string; error?: string };
        if (parsed.error) throw new Error(parsed.error);
        if (parsed.text) yield parsed.text;
      } catch {
        // skip malformed chunks
      }
    }
  }
}
