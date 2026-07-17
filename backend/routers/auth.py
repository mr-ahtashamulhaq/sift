"""Auth routes — register, login, logout (backend-mediated Supabase Auth)."""
import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from config import settings


def _supabase_unavailable(exc: Exception) -> HTTPException:
    return HTTPException(
        status_code=503,
        detail=(
            "Cannot reach Supabase. Your free-tier project may be paused — "
            "go to supabase.com/dashboard, open your project, and click Resume. "
            f"({type(exc).__name__}: {exc})"
        ),
    )

router = APIRouter(prefix="/auth", tags=["auth"])

_SUPABASE = settings.supabase_url
_KEY = settings.supabase_service_key
_HEADERS = {"apikey": _KEY, "Content-Type": "application/json"}


class AuthRequest(BaseModel):
    email: str
    password: str
    display_name: str | None = None


@router.post("/register")
async def register(req: AuthRequest):
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.post(
                f"{_SUPABASE}/auth/v1/signup",
                headers=_HEADERS,
                json={
                    "email": req.email,
                    "password": req.password,
                    "data": {"display_name": req.display_name or req.email.split("@")[0]},
                },
            )
            data = r.json()
            if r.status_code not in (200, 201):
                raise HTTPException(status_code=400, detail=data.get("error_description") or data.get("msg") or "Registration failed")

            user_id = (data.get("user") or {}).get("id") or data.get("id")
            access_token = data.get("access_token")

            # Email confirmation is enabled on the Supabase free tier by default.
            # Auto-confirm via admin API so the user can log in immediately.
            if user_id and not access_token:
                confirm_r = await client.put(
                    f"{_SUPABASE}/auth/v1/admin/users/{user_id}",
                    headers={**_HEADERS, "Authorization": f"Bearer {_KEY}"},
                    json={"email_confirm": True},
                )
                print(f"[AUTH] admin confirm status={confirm_r.status_code} body={confirm_r.text[:200]}")
                # Now get a real session token.
                login_r = await client.post(
                    f"{_SUPABASE}/auth/v1/token?grant_type=password",
                    headers=_HEADERS,
                    json={"email": req.email, "password": req.password},
                )
                print(f"[AUTH] post-confirm login status={login_r.status_code} body={login_r.text[:200]}")
                if login_r.status_code == 200:
                    login_data = login_r.json()
                    access_token = login_data.get("access_token")
                    user_id = (login_data.get("user") or {}).get("id") or user_id

    except HTTPException:
        raise
    except (httpx.ConnectError, httpx.TimeoutException) as exc:
        raise _supabase_unavailable(exc)

    return {
        "access_token": access_token,
        "user": {
            "id": user_id,
            "email": (data.get("user") or {}).get("email") or req.email,
        },
    }


@router.post("/login")
async def login(req: AuthRequest):
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.post(
                f"{_SUPABASE}/auth/v1/token?grant_type=password",
                headers=_HEADERS,
                json={"email": req.email, "password": req.password},
            )
    except (httpx.ConnectError, httpx.TimeoutException) as exc:
        raise _supabase_unavailable(exc)
    data = r.json()
    if r.status_code != 200:
        raise HTTPException(status_code=401, detail=data.get("error_description") or "Invalid credentials")
    return {
        "access_token": data["access_token"],
        "refresh_token": data.get("refresh_token"),
        "user": {
            "id": data.get("user", {}).get("id"),
            "email": data.get("user", {}).get("email"),
        },
    }


@router.post("/refresh")
async def refresh_token(body: dict):
    refresh = body.get("refresh_token")
    if not refresh:
        raise HTTPException(status_code=400, detail="refresh_token required")
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.post(
                f"{_SUPABASE}/auth/v1/token?grant_type=refresh_token",
                headers=_HEADERS,
                json={"refresh_token": refresh},
            )
    except (httpx.ConnectError, httpx.TimeoutException) as exc:
        raise _supabase_unavailable(exc)
    data = r.json()
    if r.status_code != 200:
        raise HTTPException(status_code=401, detail="Token refresh failed")
    return {"access_token": data["access_token"], "refresh_token": data.get("refresh_token")}


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    access_token: str
    new_password: str


@router.post("/forgot-password")
async def forgot_password(req: ForgotPasswordRequest):
    """Triggers Supabase to send a password-reset email."""
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.post(
                f"{_SUPABASE}/auth/v1/recover",
                headers=_HEADERS,
                json={"email": req.email},
            )
    except (httpx.ConnectError, httpx.TimeoutException) as exc:
        raise _supabase_unavailable(exc)
    # Supabase returns 200 even if the email doesn't exist (security by design)
    if r.status_code not in (200, 204):
        data = r.json()
        raise HTTPException(status_code=400, detail=data.get("error_description") or "Failed to send reset email")
    return {"message": "If that email is registered you will receive a reset link shortly."}


@router.post("/reset-password")
async def reset_password(req: ResetPasswordRequest):
    """Updates password using the recovery access token from the reset email link."""
    if len(req.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.put(
                f"{_SUPABASE}/auth/v1/user",
                headers={**_HEADERS, "Authorization": f"Bearer {req.access_token}"},
                json={"password": req.new_password},
            )
    except (httpx.ConnectError, httpx.TimeoutException) as exc:
        raise _supabase_unavailable(exc)
    data = r.json()
    if r.status_code != 200:
        raise HTTPException(status_code=400, detail=data.get("error_description") or data.get("msg") or "Password reset failed")
    return {"message": "Password updated successfully."}
