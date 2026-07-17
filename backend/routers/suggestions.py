"""Project suggestion routes."""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from middleware.auth import get_current_user
from agents.suggestions import get_project_suggestions

router = APIRouter(prefix="/suggestions", tags=["suggestions"])


class SuggestionRequest(BaseModel):
    skills: list[str] = []
    experience: str = "mid"
    hourly_rate: float = 0
    current_score: Optional[float] = None
    target_score: float = 80.0
    github_url: Optional[str] = None


@router.post("")
async def suggest_projects(req: SuggestionRequest, user: dict | None = Depends(get_current_user)):
    suggestions = get_project_suggestions(
        user_skills=req.skills,
        experience=req.experience,
        hourly_rate=req.hourly_rate,
        current_score=req.current_score,
        target_score=req.target_score,
        github_url=req.github_url,
    )
    return {"suggestions": suggestions}
