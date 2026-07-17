"""Analyze a specific job URL or pasted description."""
import asyncio
import uuid
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from middleware.auth import get_current_user
from agents.scraper import scrape_listing, _from_serp_snippet
from agents.unlocker import get_client_profile
from ai.scorer import score_listing
import database as db

router = APIRouter(prefix="/jobs", tags=["jobs"])


class JobAnalysisRequest(BaseModel):
    url: Optional[str] = None
    description: Optional[str] = None  # pasted job description
    title: Optional[str] = None
    skills: list[str] = []
    hourly_rate: float = 0
    experience: str = "mid"


@router.post("/analyze")
async def analyze_job(req: JobAnalysisRequest, user: dict | None = Depends(get_current_user)):
    user_ctx = {
        "skills": req.skills,
        "hourly_rate": req.hourly_rate,
        "experience": req.experience,
    }

    # Build listing dict
    if req.url:
        platform = _detect_platform(req.url)

        # Scrape listing directly
        sem = asyncio.Semaphore(1)
        listing = await scrape_listing(
            {
                "url": req.url,
                "title": req.title or "",
                "snippet": req.description or "",
                "platform": platform,
            },
            sem,
        )
        if not listing:
            listing = {
                "url": req.url,
                "title": req.title or "Untitled",
                "description": req.description or "",
                "platform": platform,
            }
    elif req.description:
        listing = {
            "url": "",
            "title": req.title or "Pasted job",
            "platform": "custom",
            "budget_min": None,
            "budget_max": None,
            "bid_count": None,
            "posted_at": None,
            "client_id": "",
            "description": req.description[:1000],
            "skills": ", ".join(req.skills),
        }
    else:
        return {"error": "Provide a url or description"}

    # Try to get client profile
    client = None
    if listing.get("client_id"):
        client = await get_client_profile(listing["client_id"])

    # Get market rates
    market = db.get_market_rates(req.skills[0] if req.skills else "general")

    score_data = score_listing(listing, client, market, user_ctx)

    opp_id = str(uuid.uuid4())
    opp = {
        "id": opp_id,
        "title": listing.get("title", "Untitled"),
        "url": listing.get("url", ""),
        "platform": listing.get("platform", "custom"),
        "budget_min": listing.get("budget_min"),
        "budget_max": listing.get("budget_max"),
        "bid_count": listing.get("bid_count"),
        "posted_at": listing.get("posted_at"),
        "sift_score": score_data.get("sift_score", 50),
        "verdict": score_data.get("verdict", "risky"),
        "reasons": score_data.get("reasons", []),
        "red_flags": score_data.get("red_flags", []),
        "proposal_angle": score_data.get("proposal_angle"),
        "is_demo": False,
    }

    return {
        "opportunity": opp,
        "client_profile": client,
        "market_rates": market,
        "sift_score": opp["sift_score"],
        "reasons": opp["reasons"],
        "red_flags": opp["red_flags"],
        "proposal_angle": opp["proposal_angle"],
        "verdict": opp["verdict"],
    }


def _detect_platform(url: str) -> str:
    for plat in ["upwork", "freelancer", "guru", "toptal", "peopleperhour"]:
        if plat in url:
            return plat
    return "custom"
