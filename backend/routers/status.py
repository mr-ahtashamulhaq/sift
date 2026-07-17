from fastapi import APIRouter, HTTPException
from models.schemas import StatusResponse
import database as db

router = APIRouter()


@router.get("/status/{scan_id}", response_model=StatusResponse)
async def get_status(scan_id: str):
    scan = db.get_scan(scan_id)
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    return StatusResponse(
        scan_id=scan_id,
        status=scan["status"],
        progress=scan.get("progress", ""),
    )
