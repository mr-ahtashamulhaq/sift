"""
Main scraping pipeline — orchestrates Serper SERP + direct scraping + AI scoring.
Runs as a FastAPI BackgroundTask so it never blocks the HTTP response.
"""
import asyncio
import uuid
from datetime import datetime, timezone

import database as db
from agents.serp import search_job_listings
from agents.scraper import scrape_listing
from agents.unlocker import get_client_profile
from agents.portfolio import get_portfolio_context
from ai.scorer import score_listing_async
from memory.cognee_memory import store_scan_results, get_client_memory, get_user_scan_insights
from models.schemas import ScanRequest

MAX_CONCURRENT = 8
MAX_LISTINGS = 12


class _ProgressTracker:
    def __init__(self, total: int):
        self.total = total
        self.done = 0
        self.lock = asyncio.Lock()

    async def tick(self, scan_id: str) -> None:
        async with self.lock:
            self.done += 1
            db.update_scan_status(
                scan_id,
                "processing",
                f"Scoring {self.done} of {self.total} opportunities...",
            )


async def _process_listing(
    scan_id: str,
    item: dict,
    user: dict,
    sem: asyncio.Semaphore,
    progress: _ProgressTracker,
    listings_out: list[dict],
    listings_lock: asyncio.Lock,
) -> None:
    listing = await scrape_listing(item, sem, fast=True)
    if not listing or not _is_usable(listing):
        return

    client = None
    client_id = listing.get("client_id", "")
    if client_id:
        try:
            client = await get_client_profile(client_id)
        except Exception:
            pass

    # Enrich scoring context with Cognee memory for this specific client
    scoring_user = dict(user)
    client_memory = await get_client_memory(client_id)
    if client_memory:
        scoring_user["client_memory"] = client_memory

    score_data = await score_listing_async(listing, client, None, scoring_user)

    db.save_opportunity({
        "id": str(uuid.uuid4()),
        "scan_id": scan_id,
        "title": listing.get("title", "Untitled"),
        "url": listing.get("url", ""),
        "platform": listing.get("platform", "upwork"),
        "budget_min": listing.get("budget_min"),
        "budget_max": listing.get("budget_max"),
        "bid_count": listing.get("bid_count"),
        "posted_at": listing.get("posted_at"),
        "client_id": client_id,
        "sift_score": score_data.get("sift_score", 50),
        "verdict": score_data.get("verdict", "risky"),
        "reasons": score_data.get("reasons", []),
        "red_flags": score_data.get("red_flags", []),
        "proposal_angle": score_data.get("proposal_angle", ""),
        "is_demo": False,
    })

    async with listings_lock:
        listings_out.append(listing)

    await progress.tick(scan_id)


def _is_usable(listing: dict) -> bool:
    """Drop listings that are too old or have almost no extractable data."""
    # Drop if posted more than 60 days ago
    if listing.get("posted_at"):
        try:
            posted = datetime.fromisoformat(listing["posted_at"].replace("Z", "+00:00"))
            if (datetime.now(timezone.utc) - posted).days > 60:
                return False
        except Exception:
            pass
    # Drop if no title AND no budget AND no description
    has_title = bool(listing.get("title") and listing["title"] != "Untitled")
    has_budget = listing.get("budget_max") is not None
    has_desc = bool((listing.get("description") or "").strip())
    if not has_title and not has_budget and not has_desc:
        return False
    return True


async def run_pipeline(scan_id: str, req: ScanRequest, user_id: str | None = None) -> None:
    """SERP → per-listing scrape → client → score → save (concurrent workers)."""
    try:
        db.update_scan_status(scan_id, "processing", "Searching job boards...")
        try:
            _serp, portfolio_ctx, user_memory = await asyncio.gather(
                search_job_listings([s.name for s in req.skills], num_results=MAX_LISTINGS),
                get_portfolio_context(req.github_url, req.portfolio_url),
                get_user_scan_insights(user_id or ""),
                return_exceptions=True,
            )
            if isinstance(_serp, RuntimeError):
                raise _serp
            if isinstance(_serp, Exception):
                raise _serp
            serp_results = _serp
        except RuntimeError as e:
            db.update_scan_status(scan_id, "error", f"Configuration error: {e}. Check SERPER_API_KEY in your environment variables.")
            return

        if not serp_results:
            db.update_scan_status(scan_id, "error", "Serper returned no results. Check that SERPER_API_KEY is set and your credits haven't run out.")
            return

        items = serp_results[:MAX_LISTINGS]
        total = len(items)
        db.update_scan_status(
            scan_id, "processing",
            f"Found {total} listings, scoring opportunities...",
        )

        user = req.model_dump()
        if isinstance(portfolio_ctx, str) and portfolio_ctx:
            user["portfolio_context"] = portfolio_ctx
        if isinstance(user_memory, str) and user_memory:
            user["user_memory"] = user_memory
        sem = asyncio.Semaphore(MAX_CONCURRENT)
        progress = _ProgressTracker(total)
        listings_out: list[dict] = []
        listings_lock = asyncio.Lock()

        await asyncio.gather(
            *[
                _process_listing(scan_id, item, user, sem, progress, listings_out, listings_lock)
                for item in items
            ],
            return_exceptions=True,
        )
        if not listings_out:
            db.update_scan_status(
                scan_id,
                "error",
                "All listings were filtered out (stale or missing data). Try again — SERP results vary.",
            )
            return

        market = _compute_market_rates(listings_out, [s.name for s in req.skills])
        if market:
            db.upsert_market_rates(market)

        db.update_scan_status(scan_id, "complete", "Done")

        # Persist results to Cognee memory for future scan enrichment
        if user_id:
            saved_opps = db.get_opportunities(scan_id)
            asyncio.create_task(
                store_scan_results(scan_id, user_id, saved_opps)
            )

    except Exception as e:
        print(f"[Pipeline] Fatal error for scan {scan_id}: {e}")
        import traceback
        traceback.print_exc()
        db.update_scan_status(scan_id, "error", "Pipeline error — please try again.")


def _compute_market_rates(listings: list[dict], skills: list[str]) -> dict | None:
    budgets = sorted([
        l["budget_max"] for l in listings
        if l.get("budget_max") and l["budget_max"] > 0
    ])
    if len(budgets) < 3:
        return None

    n = len(budgets)
    return {
        "id": str(uuid.uuid4()),
        "skill_tag": skills[0].lower() if skills else "general",
        "platform": "multi",
        "p25_rate": budgets[n // 4],
        "median_rate": budgets[n // 2],
        "p75_rate": budgets[3 * n // 4],
        "sample_count": n,
        "week_start": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
    }
