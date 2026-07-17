export interface User {
  id: string;
  email: string;
}

export interface UserProfile {
  user_id: string;
  display_name: string | null;
  skills: string[];
  hourly_rate: number;
  experience: "junior" | "mid" | "senior";
  github_url: string | null;
  bio: string | null;
  onboarded: boolean;
  created_at: string;
}

export interface Opportunity {
  id: string;
  title: string;
  url: string;
  platform: string;
  budget_min: number | null;
  budget_max: number | null;
  bid_count: number | null;
  posted_at: string | null;
  sift_score: number;
  verdict: "go" | "skip" | "risky";
  reasons: string[];
  red_flags: string[];
  proposal_angle: string | null;
  is_demo: boolean;
}

export interface MarketRates {
  skill_tag: string;
  p25_rate: number;
  median_rate: number;
  p75_rate: number;
  sample_count: number;
}

export interface ClientProfile {
  client_id: string;
  platform: string;
  total_spent: number;
  hire_rate: number;
  review_count: number;
  dispute_count: number;
  avg_rating: number;
  avg_duration_days: number;
}

export interface AnalysisResponse {
  opportunity: Opportunity;
  client_profile: ClientProfile | null;
  market_rates: MarketRates | null;
  sift_score: number;
  reasons: string[];
  red_flags: string[];
  proposal_angle: string | null;
  verdict: string;
}

export interface OpportunitiesResponse {
  status: string;
  message?: string;
  opportunities: Opportunity[];
  market_rates?: MarketRates;
}

export interface SkillEntry {
  name: string;
  level: "beginner" | "competent" | "expert";
}

export interface ScanRequest {
  skills: SkillEntry[];
  hourly_rate: number;
  experience: "junior" | "mid" | "senior";
  niche?: string;
  github_url?: string;
  portfolio_url?: string;
}

export interface Scan {
  id: string;
  skills: string[];
  hourly_rate: number;
  experience: string;
  status: string;
  progress: string;
  created_at: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface Suggestion {
  title: string;
  description: string;
  skills_gained: string[];
  estimated_hours: number;
  score_impact: string;
  difficulty: "easy" | "medium" | "hard";
  reason: string;
}
