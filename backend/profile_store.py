"""User profile storage via Supabase Auth user_metadata (no DB tables required)."""
from datetime import datetime, timezone

import httpx
from config import settings

_HEADERS = {
    "apikey": settings.supabase_service_key,
    "Authorization": f"Bearer {settings.supabase_service_key}",
    "Content-Type": "application/json",
}

PROFILE_FIELDS = frozenset({
    "display_name", "skills", "hourly_rate", "experience",
    "github_url", "portfolio_url", "bio", "onboarded",
})


def normalize_profile(user_id: str, meta: dict, email: str = "") -> dict:
    display = meta.get("display_name")
    if not display and email:
        display = email.split("@")[0]
    return {
        "user_id": user_id,
        "display_name": display,
        "skills": meta.get("skills") or [],
        "hourly_rate": float(meta.get("hourly_rate") or 0),
        "experience": meta.get("experience") or "mid",
        "github_url": meta.get("github_url"),
        "portfolio_url": meta.get("portfolio_url"),
        "bio": meta.get("bio"),
        "onboarded": bool(meta.get("onboarded", False)),
        "created_at": meta.get("profile_created_at") or datetime.now(timezone.utc).isoformat(),
    }


def profile_from_user(user: dict) -> dict:
    meta = user.get("user_metadata") or {}
    return normalize_profile(user["id"], meta, user.get("email", ""))


async def update_profile(user_id: str, updates: dict, current_meta: dict | None = None) -> dict:
    meta = dict(current_meta or {})
    email = ""

    async with httpx.AsyncClient(timeout=15) as client:
        if current_meta is None:
            r = await client.get(
                f"{settings.supabase_url}/auth/v1/admin/users/{user_id}",
                headers=_HEADERS,
            )
            if r.status_code != 200:
                raise RuntimeError(f"Could not load profile: {r.text[:200]}")
            data = r.json()
            meta = dict(data.get("user_metadata") or {})
            email = data.get("email") or ""

        for key, value in updates.items():
            if key in PROFILE_FIELDS:
                meta[key] = value

        if "profile_created_at" not in meta:
            meta["profile_created_at"] = datetime.now(timezone.utc).isoformat()

        r = await client.put(
            f"{settings.supabase_url}/auth/v1/admin/users/{user_id}",
            headers=_HEADERS,
            json={"user_metadata": meta},
        )
        if r.status_code != 200:
            raise RuntimeError(f"Could not save profile: {r.text[:200]}")
        if not email:
            email = r.json().get("email") or ""

    return normalize_profile(user_id, meta, email)
