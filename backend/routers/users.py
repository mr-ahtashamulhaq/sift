"""User profile routes."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from middleware.auth import require_user
import profile_store

router = APIRouter(prefix="/users", tags=["users"])


class ProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    skills: Optional[list[str]] = None
    hourly_rate: Optional[float] = None
    experience: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    bio: Optional[str] = None
    onboarded: Optional[bool] = None


@router.get("/me")
async def get_profile(user: dict = Depends(require_user)):
    return profile_store.profile_from_user(user)


@router.put("/me")
async def update_profile(body: ProfileUpdate, user: dict = Depends(require_user)):
    user_id = user["id"]
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    try:
        meta = user.get("user_metadata") or {}
        return await profile_store.update_profile(user_id, updates, current_meta=meta)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
