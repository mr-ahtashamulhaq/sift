"""
Serper.dev SERP — searches Google via the Serper JSON API.
Docs: https://serper.dev/
One API key covers all searches. Returns structured organic results.
"""
import httpx
import asyncio
from config import settings

SERPER_API = "https://google.serper.dev/search"


def _headers() -> dict:
    return {
        "X-API-KEY": settings.serper_api_key,
        "Content-Type": "application/json",
    }


PLATFORMS = [
    ("upwork",        "site:upwork.com/jobs"),
    ("freelancer",    "site:freelancer.com/projects"),
    ("guru",          "site:guru.com/jobs"),
    ("peopleperhour", "site:peopleperhour.com/projects"),
    ("toptal",        "site:toptal.com/freelance-jobs"),
]


def _classify_platform(url: str) -> str:
    for name, _ in PLATFORMS:
        if name in url:
            return name
    return "other"


def _clean_url(url: str) -> str:
    return url.strip().strip('"\'')


async def _serper_request(query: str, num: int, use_date_filter: bool = True) -> list[dict]:
    """Single Serper API call. Returns raw organic list."""
    payload: dict = {"q": query, "num": min(num, 10)}
    if use_date_filter:
        payload["tbs"] = "qdr:m"   # last month

    try:
        async with httpx.AsyncClient(timeout=20) as client:
            r = await client.post(SERPER_API, headers=_headers(), json=payload)
            if r.status_code != 200:
                print(f"[SERP] {r.status_code} for '{query[:60]}': {r.text[:150]}")
                return []
            return r.json().get("organic") or []
    except Exception as e:
        print(f"[SERP] Request error for '{query[:60]}': {e}")
        return []


def _organic_to_results(organic: list[dict]) -> list[dict]:
    out = []
    for item in organic:
        url = _clean_url(item.get("link", ""))
        if not url or not url.startswith("http"):
            continue
        out.append({
            "url": url,
            "title": item.get("title", ""),
            "snippet": item.get("snippet", ""),
            "platform": _classify_platform(url),
        })
    return out


async def _search_platform(platform_prefix: str, skills: list[str], num_results: int) -> list[dict]:
    query = f'{platform_prefix} {" ".join(skills)}'

    # Try 1: with last-month date filter
    organic = await _serper_request(query, num_results, use_date_filter=True)
    if organic:
        results = _organic_to_results(organic)
        print(f"[SERP] {len(results)} results (filtered) for '{query[:55]}'")
        return results

    # Try 2: without date filter — broader reach
    organic = await _serper_request(query, num_results, use_date_filter=False)
    results = _organic_to_results(organic)
    print(f"[SERP] {len(results)} results (unfiltered) for '{query[:55]}'")
    return results


async def _search_combined(skills: list[str], num_results: int) -> list[dict]:
    """
    Broad multi-platform query as a fallback when site-specific searches return
    too few results. Searches for freelance jobs across all platforms in one shot.
    """
    skill_str = " ".join(skills[:3])  # keep it focused
    query = f'freelance job {skill_str} (site:upwork.com OR site:freelancer.com OR site:guru.com OR site:peopleperhour.com)'

    organic = await _serper_request(query, num_results, use_date_filter=False)
    results = _organic_to_results(organic)
    print(f"[SERP] {len(results)} results from combined broad query")
    return results


async def search_all_platforms(skills: list[str], num_results: int = 20) -> list[dict]:
    if not settings.serper_api_key:
        raise RuntimeError("SERPER_API_KEY is not set — get your free key at https://serper.dev")

    per_platform = max(4, num_results // len(PLATFORMS))

    # Run all platform searches concurrently
    tasks = [_search_platform(prefix, skills, per_platform) for _, prefix in PLATFORMS]
    results_per_platform = await asyncio.gather(*tasks, return_exceptions=True)

    seen: set[str] = set()
    combined: list[dict] = []
    for res in results_per_platform:
        if isinstance(res, list):
            for item in res:
                url = item.get("url", "")
                if url and url not in seen:
                    seen.add(url)
                    combined.append(item)

    # If individual platform searches didn't return enough, try a broad combined query
    if len(combined) < 5:
        print(f"[SERP] Only {len(combined)} results from platform searches — trying broad query")
        broad = await _search_combined(skills, num_results)
        for item in broad:
            url = item.get("url", "")
            if url and url not in seen:
                seen.add(url)
                combined.append(item)

    print(f"[SERP] Total: {len(combined)} URLs across all platforms")
    return combined[:num_results]


async def search_job_listings(skills: list[str], num_results: int = 20) -> list[dict]:
    return await search_all_platforms(skills, num_results)


# Legacy shims (kept for compatibility)
async def search_upwork_listings(skills: list[str], num_results: int = 20) -> list[str]:
    r = await _search_platform("site:upwork.com/jobs", skills, num_results)
    return [x["url"] for x in r if "upwork.com/jobs/" in x["url"]]


async def search_freelancer_listings(skills: list[str], num_results: int = 20) -> list[str]:
    r = await _search_platform("site:freelancer.com/projects", skills, num_results)
    return [x["url"] for x in r if "freelancer.com/projects/" in x["url"]]
