from datetime import datetime, timezone
from supabase import create_client, Client
from config import settings

_client: Client | None = None


def get_db() -> Client:
    global _client
    if _client is None:
        _client = create_client(settings.supabase_url, settings.supabase_service_key)
    return _client


# --- Scans ---

def create_scan(scan_id: str, skills: list[str], hourly_rate: float, experience: str, user_id: str | None = None) -> dict:
    data = {
        "id": scan_id,
        "skills": skills,
        "hourly_rate": hourly_rate,
        "experience": experience,
        "status": "processing",
        "progress": "Starting scan...",
    }
    if user_id:
        data["user_id"] = user_id
    result = get_db().table("scans").insert(data).execute()
    return result.data[0] if result.data else {}


def update_scan_status(scan_id: str, status: str, progress: str = "") -> None:
    update = {"status": status}
    if progress:
        update["progress"] = progress
    get_db().table("scans").update(update).eq("id", scan_id).execute()


def get_scan(scan_id: str) -> dict | None:
    result = get_db().table("scans").select("*").eq("id", scan_id).execute()
    return result.data[0] if result.data else None


def get_user_scans(user_id: str, limit: int = 20) -> list[dict]:
    result = (
        get_db().table("scans")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return result.data or []


# --- Opportunities ---

def save_opportunity(data: dict) -> dict:
    result = get_db().table("opportunities").insert(data).execute()
    return result.data[0] if result.data else {}


def get_opportunities(scan_id: str) -> list[dict]:
    result = (
        get_db().table("opportunities")
        .select("*")
        .eq("scan_id", scan_id)
        .order("sift_score", desc=True)
        .execute()
    )
    return result.data or []


def get_opportunity(opportunity_id: str) -> dict | None:
    result = get_db().table("opportunities").select("*").eq("id", opportunity_id).execute()
    return result.data[0] if result.data else None


def get_demo_opportunities() -> list[dict]:
    result = (
        get_db().table("opportunities")
        .select("*")
        .eq("is_demo", True)
        .order("sift_score", desc=True)
        .execute()
    )
    return result.data or []


# --- Client profiles ---

def get_client_profile(client_id: str) -> dict | None:
    result = get_db().table("client_profiles").select("*").eq("client_id", client_id).execute()
    return result.data[0] if result.data else None


def upsert_client_profile(data: dict) -> dict:
    result = get_db().table("client_profiles").upsert(data).execute()
    return result.data[0] if result.data else {}


# --- Market rates ---

def get_market_rates(skill_tag: str, platform: str = "upwork") -> dict | None:
    result = (
        get_db().table("market_rates")
        .select("*")
        .eq("skill_tag", skill_tag.lower())
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    return result.data[0] if result.data else None


def upsert_market_rates(data: dict) -> dict:
    result = get_db().table("market_rates").upsert(data).execute()
    return result.data[0] if result.data else {}


# --- User profiles ---

def get_user_profile(user_id: str) -> dict | None:
    result = get_db().table("user_profiles").select("*").eq("user_id", user_id).execute()
    return result.data[0] if result.data else None


def create_user_profile(user_id: str, email: str = "") -> dict:
    display_name = email.split("@")[0] if email else ""
    result = get_db().table("user_profiles").insert({
        "user_id": user_id,
        "display_name": display_name,
        "skills": [],
        "hourly_rate": 0,
        "experience": "mid",
        "onboarded": False,
    }).execute()
    return result.data[0] if result.data else {"user_id": user_id, "skills": [], "onboarded": False}


def update_user_profile(user_id: str, updates: dict) -> dict:
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = (
        get_db().table("user_profiles")
        .upsert({"user_id": user_id, **updates})
        .execute()
    )
    return result.data[0] if result.data else {}
