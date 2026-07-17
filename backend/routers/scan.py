import uuid
from fastapi import APIRouter, BackgroundTasks, Depends
from models.schemas import ScanRequest, ScanResponse
from middleware.auth import get_current_user
import database as db
from agents.pipeline import run_pipeline

router = APIRouter()


@router.post("/scan", response_model=ScanResponse)
async def start_scan(req: ScanRequest, background_tasks: BackgroundTasks, user: dict | None = Depends(get_current_user)):
    scan_id = str(uuid.uuid4())
    user_id = user["id"] if user else None
    skill_names = [s.name for s in req.skills]
    db.create_scan(scan_id, skill_names, req.hourly_rate, req.experience, user_id=user_id)
    background_tasks.add_task(run_pipeline, scan_id, req, user_id)
    return ScanResponse(scan_id=scan_id, status="processing")
