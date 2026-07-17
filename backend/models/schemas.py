from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class SkillEntry(BaseModel):
    name: str
    level: str = "competent"  # "beginner" | "competent" | "expert"


class ScanRequest(BaseModel):
    skills: list[SkillEntry]
    hourly_rate: float
    experience: str  # "junior" | "mid" | "senior"
    niche: str | None = None
    github_url: str | None = None
    portfolio_url: str | None = None


class ScanResponse(BaseModel):
    scan_id: str
    status: str


class MarketRates(BaseModel):
    skill_tag: str
    p25_rate: float
    median_rate: float
    p75_rate: float
    sample_count: int


class OpportunitySummary(BaseModel):
    id: str
    title: str
    url: str
    platform: str
    budget_min: Optional[float]
    budget_max: Optional[float]
    bid_count: Optional[int]
    posted_at: Optional[str]
    sift_score: int
    verdict: str  # "go" | "skip" | "risky"
    reasons: list[str]
    red_flags: list[str]
    proposal_angle: Optional[str]
    is_demo: bool


class OpportunitiesResponse(BaseModel):
    status: str
    message: Optional[str] = None
    opportunities: list[OpportunitySummary] = []
    market_rates: Optional[MarketRates] = None


class ClientProfileData(BaseModel):
    client_id: str
    platform: str
    total_spent: Optional[float]
    hire_rate: Optional[float]
    review_count: Optional[int]
    dispute_count: Optional[int]
    avg_rating: Optional[float]
    avg_duration_days: Optional[int]


class AnalysisResponse(BaseModel):
    opportunity: OpportunitySummary
    client_profile: Optional[ClientProfileData]
    market_rates: Optional[MarketRates]
    sift_score: int
    reasons: list[str]
    red_flags: list[str]
    proposal_angle: Optional[str]
    verdict: str


class StatusResponse(BaseModel):
    scan_id: str
    status: str
    progress: str
