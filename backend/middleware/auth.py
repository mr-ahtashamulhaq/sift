"""Supabase JWT verification — FastAPI dependency."""
import httpx
from fastapi import Header, HTTPException
from config import settings

SUPABASE_USER_URL = f"{settings.supabase_url}/auth/v1/user"
_HEADERS = {
    "apikey": settings.supabase_service_key,
    "Content-Type": "application/json",
}


async def get_current_user(authorization: str = Header(None)) -> dict | None:
    """Returns the Supabase user dict if a valid Bearer token is provided, else None."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization[7:]
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(
                SUPABASE_USER_URL,
                headers={**_HEADERS, "Authorization": f"Bearer {token}"},
            )
            if r.status_code == 200:
                return r.json()
    except (httpx.ConnectError, httpx.TimeoutException) as e:
        print(f"[Auth] Supabase unreachable (project may be paused): {e}")
    except Exception as e:
        print(f"[Auth] Token verification error: {e}")
    return None


async def require_user(authorization: str = Header(None)) -> dict:
    """Same as get_current_user but raises 401 if not authenticated."""
    user = await get_current_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user
