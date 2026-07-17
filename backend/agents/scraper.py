"""
Job listing scraper — fetches and parses job pages directly via httpx.
No external proxy service required. Uses standard browser-like headers
and falls back to SERP snippet data when direct scraping is blocked.
"""
import httpx
import asyncio
import re
from bs4 import BeautifulSoup

BROWSER_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/125.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Accept-Encoding": "gzip, deflate, br",
    "DNT": "1",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
}


async def scrape_listing(
    item: dict | str,
    semaphore: asyncio.Semaphore,
    *,
    fast: bool = True,
) -> dict | None:
    """item can be a URL string or a {url, title, snippet, platform} dict from SERP."""
    if isinstance(item, str):
        item = {"url": item, "title": "", "snippet": "", "platform": "upwork" if "upwork" in item else "freelancer"}

    url = item.get("url", "")
    if not url:
        return None

    async with semaphore:
        # Try direct HTTP scraping
        result = await _scrape_direct(url, item)
        if result:
            return result

        # Fall back to SERP snippet data
        if item.get("title") or item.get("snippet"):
            return _from_serp_snippet(item)

        return None


async def _scrape_direct(url: str, item: dict) -> dict | None:
    """Fetch the job page directly using browser-like headers, then parse HTML."""
    try:
        async with httpx.AsyncClient(
            timeout=20,
            headers=BROWSER_HEADERS,
            follow_redirects=True,
        ) as client:
            r = await client.get(url)
            if r.status_code != 200:
                print(f"[Scraper] Direct fetch {r.status_code} for {url[:60]}")
                return None
            return _parse_html(r.text, url, item)
    except Exception as e:
        print(f"[Scraper] Direct fetch error for {url[:60]}: {e}")
        return None


def _parse_html(html: str, url: str, fallback: dict) -> dict | None:
    """Parse job page HTML to extract listing details."""
    try:
        soup = BeautifulSoup(html, "html.parser")

        # Try JSON-LD first (most reliable, supported by Upwork/Freelancer)
        for script in soup.find_all("script", type="application/ld+json"):
            try:
                import json
                data = json.loads(script.string or "")
                if isinstance(data, list):
                    data = data[0]
                if data.get("@type") in ("JobPosting", "Offer"):
                    return _normalize_jsonld(data, url, fallback)
            except Exception:
                pass

        platform = fallback.get("platform", "upwork")

        # Platform-specific selectors
        if "upwork.com" in url:
            title_el  = soup.select_one("h1, [data-test='job-title'], .air3-line-clamp-1")
            desc_el   = soup.select_one("[data-test='description'], .air3-rich-text, .description")
            budget_el = soup.select_one("[data-test='budget'], .BudgetAmount, [data-qa='budget']")
            bids_el   = soup.select_one("[data-test='proposals-count'], [data-qa='proposals-count']")
        elif "freelancer.com" in url:
            title_el  = soup.select_one("h1, .PageProjectViewLogout-header-title")
            desc_el   = soup.select_one(".PageProjectViewLogout-description, .job-description")
            budget_el = soup.select_one(".PageProjectViewLogout-price, .budget-value")
            bids_el   = soup.select_one(".PageProjectViewLogout-bid-count")
        elif "guru.com" in url:
            title_el  = soup.select_one("h1, .jobTitle")
            desc_el   = soup.select_one(".jobDesc, .description")
            budget_el = soup.select_one(".budgetAmt, .jobBudget")
            bids_el   = None
        elif "peopleperhour.com" in url:
            title_el  = soup.select_one("h1, .hourlieTitle")
            desc_el   = soup.select_one(".hourlieDesc, .description")
            budget_el = soup.select_one(".price, .budget")
            bids_el   = None
        else:
            title_el  = soup.select_one("h1")
            desc_el   = soup.select_one("main p, article p")
            budget_el = None
            bids_el   = None

        title = title_el.get_text(strip=True) if title_el else fallback.get("title", "")
        desc  = desc_el.get_text(strip=True)[:500] if desc_el else fallback.get("snippet", "")

        budget_text = budget_el.get_text(strip=True) if budget_el else ""
        budget_min, budget_max = _parse_budget(budget_text or html[:2000])
        bids = _parse_bids(bids_el.get_text(strip=True) if bids_el else "")

        if not title:
            title = fallback.get("title", "")

        result = {
            "title": title or "Untitled",
            "url": url,
            "platform": platform,
            "budget_min": budget_min,
            "budget_max": budget_max,
            "bid_count": bids,
            "posted_at": None,
            "client_id": _extract_client_id(url, html),
            "description": desc,
            "skills": "",
        }
        print(f"[Scraper] Parsed: {(title or 'Untitled')[:50]}")
        return result
    except Exception as e:
        print(f"[Scraper] HTML parse error for {url[:60]}: {e}")
        return None


def _from_serp_snippet(item: dict) -> dict:
    """Build a minimal listing from SERP snippet when scraping fails."""
    url = item.get("url", "")
    return {
        "title": item.get("title", "Untitled"),
        "url": url,
        "platform": item.get("platform", "upwork"),
        "budget_min": None,
        "budget_max": None,
        "bid_count": None,
        "posted_at": None,
        "client_id": "",
        "description": item.get("snippet", ""),
        "skills": "",
    }


def _normalize_jsonld(data: dict, url: str, fallback: dict) -> dict:
    base = data.get("baseSalary") or {}
    val  = base.get("value") or {}
    return {
        "title": data.get("title", fallback.get("title", "Untitled")),
        "url": url,
        "platform": fallback.get("platform", "upwork"),
        "budget_min": _float(val.get("minValue")),
        "budget_max": _float(val.get("maxValue") or val.get("value")),
        "bid_count": None,
        "posted_at": data.get("datePosted"),
        "client_id": "",
        "description": (data.get("description") or "")[:500],
        "skills": ", ".join(data.get("skills", [])),
    }


def _parse_budget(text: str) -> tuple[float | None, float | None]:
    nums = re.findall(r"\$?([\d,]+(?:\.\d+)?)", text)
    nums = [float(n.replace(",", "")) for n in nums if float(n.replace(",", "")) > 0]
    if len(nums) >= 2:
        return min(nums[:2]), max(nums[:2])
    if len(nums) == 1:
        v = nums[0]
        return v * 0.8, v
    return None, None


def _parse_bids(text: str) -> int | None:
    m = re.search(r"(\d+)", text)
    return int(m.group(1)) if m else None


def _extract_client_id(url: str, html: str) -> str:
    m = re.search(r"/o/profiles/users/~([A-Za-z0-9]+)", url + html[:1000])
    if m:
        return m.group(1)
    m = re.search(r'"clientId":\s*"([^"]+)"', html[:2000])
    if m:
        return m.group(1)
    return ""


def _float(v) -> float | None:
    try:
        return float(v) if v is not None else None
    except Exception:
        return None


def _int(v) -> int | None:
    try:
        return int(v) if v is not None else None
    except Exception:
        return None
