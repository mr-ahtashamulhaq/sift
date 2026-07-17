from fastapi import APIRouter, HTTPException, Depends
from models.schemas import OpportunitiesResponse
from middleware.auth import require_user
import database as db

router = APIRouter()


@router.get("/opportunities/{scan_id}", response_model=OpportunitiesResponse)
async def get_opportunities(scan_id: str):
    if scan_id == "demo":
        opps = db.get_demo_opportunities()
        market = db.get_market_rates("react")  # default demo skill
        return OpportunitiesResponse(
            status="complete",
            opportunities=opps,
            market_rates=market,
        )

    scan = db.get_scan(scan_id)
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    opps = db.get_opportunities(scan_id)

    if scan["status"] != "complete":
        return OpportunitiesResponse(
            status=scan["status"],
            message=scan.get("progress", "Processing..."),
            opportunities=opps,
        )
    # Get market rates for the primary skill
    skills = scan.get("skills") or []
    market = db.get_market_rates(skills[0].lower()) if skills else None

    return OpportunitiesResponse(
        status="complete",
        opportunities=opps,
        market_rates=market,
    )


@router.get("/scans/history")
async def get_scan_history(user: dict = Depends(require_user)):
    scans = db.get_user_scans(user["id"])
    return {"scans": scans}
