from fastapi import APIRouter, HTTPException
from models.schemas import AnalysisResponse
import database as db
from agents.unlocker import get_client_profile

router = APIRouter()


@router.post("/analyze/{opportunity_id}", response_model=AnalysisResponse)
async def analyze_opportunity(opportunity_id: str):
    opp = db.get_opportunity(opportunity_id)
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    # Fetch or retrieve cached client profile
    client = None
    if opp.get("client_id"):
        client = await get_client_profile(opp["client_id"], opp.get("platform", "upwork"))

    # Market rates for this opportunity's skill context
    scan = db.get_scan(opp.get("scan_id", "")) if opp.get("scan_id") else None
    skills = scan.get("skills", []) if scan else []
    market = db.get_market_rates(skills[0].lower()) if skills else None

    return AnalysisResponse(
        opportunity=opp,
        client_profile=client,
        market_rates=market,
        sift_score=opp.get("sift_score", 50),
        reasons=opp.get("reasons", []),
        red_flags=opp.get("red_flags", []),
        proposal_angle=opp.get("proposal_angle"),
        verdict=opp.get("verdict", "risky"),
    )
