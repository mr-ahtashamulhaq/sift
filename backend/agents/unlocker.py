"""
Client profile scraper — fetches Upwork/Freelancer client profiles directly via httpx.
Results cached 24 hrs in Supabase to avoid repeated requests.
"""
import httpx
from datetime import datetime, timezone, timedelta
from bs4 import BeautifulSoup
import database as db

CACHE_TTL_HOURS = 24

BROWSER_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/125.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
}


async def get_client_profile(client_id: str, platform: str = "upwork") -> dict | None:
    """Returns client profile, using Supabase cache when fresh (<24 hrs old)."""
    if not client_id:
        return None

    cached = db.get_client_profile(client_id)
    if cached and _is_fresh(cached.get("scraped_at")):
        print(f"[Unlocker] Cache hit for client {client_id}")
        return cached

    profile = await _scrape_client_profile(client_id, platform)
    if profile:
        db.upsert_client_profile(profile)
    return profile


def _is_fresh(scraped_at: str | None) -> bool:
    if not scraped_at:
        return False
    try:
        ts = datetime.fromisoformat(scraped_at.replace("Z", "+00:00"))
        return datetime.now(timezone.utc) - ts < timedelta(hours=CACHE_TTL_HOURS)
    except Exception:
        return False


async def _scrape_client_profile(client_id: str, platform: str) -> dict | None:
    if platform == "upwork":
        target_url = f"https://www.upwork.com/o/profiles/users/~{client_id}/"
    else:
        target_url = f"https://www.freelancer.com/u/{client_id}"

    try:
        async with httpx.AsyncClient(
            timeout=20,
            headers=BROWSER_HEADERS,
            follow_redirects=True,
        ) as client:
            response = await client.get(target_url)
            if response.status_code != 200:
                print(f"[Unlocker] HTTP {response.status_code} for client {client_id}")
                return None
            return _parse_upwork_profile(response.text, client_id, platform)

    except Exception as e:
        print(f"[Unlocker] Error for client {client_id}: {e}")
        return None


def _parse_upwork_profile(html: str, client_id: str, platform: str) -> dict:
    soup = BeautifulSoup(html, "html.parser")
    profile: dict = {
        "client_id": client_id,
        "platform": platform,
        "scraped_at": datetime.now(timezone.utc).isoformat(),
        "total_spent": 0.0,
        "hire_rate": 0.0,
        "review_count": 0,
        "dispute_count": 0,
        "avg_rating": 0.0,
        "avg_duration_days": 0,
    }

    # Try various Upwork data attribute selectors
    spent_el = (
        soup.find(attrs={"data-qa": "client-total-spent"})
        or soup.find(class_="total-spent")
    )
    if spent_el:
        profile["total_spent"] = _extract_dollar(spent_el.get_text())

    hire_el = soup.find(attrs={"data-qa": "hire-rate"})
    if hire_el:
        profile["hire_rate"] = _extract_percent(hire_el.get_text())

    review_el = soup.find(attrs={"data-qa": "total-reviews"})
    if review_el:
        profile["review_count"] = _extract_int(review_el.get_text())

    rating_el = soup.find(attrs={"data-qa": "rating"})
    if rating_el:
        try:
            profile["avg_rating"] = float(rating_el.get_text().strip())
        except ValueError:
            pass

    return profile


def _extract_dollar(text: str) -> float:
    import re
    match = re.search(r"\$([\d,]+(?:\.\d+)?)\s*([KkMm]?)", text)
    if not match:
        return 0.0
    val = float(match.group(1).replace(",", ""))
    suffix = match.group(2).upper()
    if suffix == "K":
        val *= 1_000
    elif suffix == "M":
        val *= 1_000_000
    return val


def _extract_percent(text: str) -> float:
    import re
    match = re.search(r"([\d.]+)\s*%", text)
    return float(match.group(1)) if match else 0.0


def _extract_int(text: str) -> int:
    import re
    match = re.search(r"[\d,]+", text)
    return int(match.group().replace(",", "")) if match else 0
