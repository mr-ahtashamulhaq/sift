"""
Cognee-based agent memory for Sift.
Builds a knowledge graph from every completed scan.
On future scans, enriches scoring with:
  - client reputation data from prior scans
  - user-specific patterns (platforms, score ranges, winning conditions)
Uses AI/ML API as the LLM + embedding backend for Cognee.
Gracefully degrades if cognee or aiml_api_key is unavailable.
"""
import asyncio
import logging
import os
from config import settings

log = logging.getLogger(__name__)
_ready: bool | None = None


def _setup() -> bool:
    if not settings.aiml_api_key:
        return False
    try:
        import cognee  # noqa: F401

        os.environ.setdefault("ENABLE_BACKEND_ACCESS_CONTROL", "false")

        # Set env vars for LiteLLM (primary config path — works across all cognee versions)
        os.environ["OPENAI_API_KEY"]  = settings.aiml_api_key
        os.environ["OPENAI_API_BASE"] = "https://api.aimlapi.com/v1"

        # Also try cognee.config direct assignment — attribute names vary by version
        try:
            cognee.config.llm_api_key  = settings.aiml_api_key
            cognee.config.llm_api_base = "https://api.aimlapi.com/v1"
            cognee.config.llm_model    = "openai/gpt-4o-mini"
        except AttributeError:
            pass  # env vars above are sufficient for LiteLLM

        log.info("Cognee memory initialised (AI/ML API backend)")
        return True
    except ImportError:
        log.warning("cognee not installed — memory features disabled")
        return False
    except Exception as e:
        log.warning(f"Cognee setup failed: {e}")
        return False


def _is_ready() -> bool:
    global _ready
    if _ready is None:
        _ready = _setup()
    return _ready


def _extract_text(result) -> str:
    """Extract plain text from a Cognee SearchResult regardless of version."""
    for attr in ("answer", "value", "text", "content", "node_description", "description"):
        val = getattr(result, attr, None)
        if val and isinstance(val, str) and val.strip():
            return val.strip()
    # Last resort — str() may give a readable representation in some versions
    return str(result)


async def store_scan_results(scan_id: str, user_id: str, opportunities: list[dict]) -> None:
    """
    After a scan completes, persist scored opportunities into Cognee's knowledge graph.
    Runs as a detached background task — never blocks the scan response.
    On future scans, this data is retrieved via get_client_memory / get_user_scan_insights.
    """
    if not _is_ready():
        return
    try:
        import cognee

        lines = [f"Sift scan {scan_id} for user {user_id[:8]}:"]
        for opp in opportunities[:10]:
            lines.append(
                f"  Platform={opp.get('platform','?')} "
                f"Score={opp.get('sift_score',0)} "
                f"Verdict={opp.get('verdict','?')} "
                f"Bids={opp.get('bid_count','?')} "
                f"Budget=${opp.get('budget_max','?')}/hr "
                f"Client={opp.get('client_id','unknown')} "
                f"Title=\"{opp.get('title','')[:60]}\""
            )

        dataset = f"user_{user_id[:8]}_scans"
        await cognee.add("\n".join(lines), dataset_name=dataset)

        # cognify builds the graph — run as separate task so it doesn't block
        asyncio.create_task(_cognify_safe(dataset))

    except Exception as e:
        log.warning(f"Cognee store_scan_results failed (non-critical): {e}")


async def _cognify_safe(dataset: str) -> None:
    try:
        import cognee
        await cognee.cognify(datasets=[dataset])
        log.info(f"Cognee cognify complete for dataset {dataset}")
    except Exception as e:
        log.warning(f"Cognee cognify failed (non-critical): {e}")


async def get_client_memory(client_id: str) -> str | None:
    """
    Query the knowledge graph for prior intelligence on a client.
    Returns a short string injected into the Claude scoring prompt.
    """
    if not _is_ready() or not client_id:
        return None
    try:
        import cognee
        from cognee import SearchType

        results = await cognee.search(
            f"client {client_id} hire rate disputes total spent reputation",
            query_type=SearchType.GRAPH_COMPLETION,
        )
        if results:
            text = _extract_text(results[0])[:300]
            if text:
                return f"[Memory] Prior intelligence on client {client_id}: {text}"
    except Exception as e:
        log.debug(f"Cognee client query failed (non-critical): {e}")
    return None


async def get_user_scan_insights(user_id: str) -> str | None:
    """
    Query the knowledge graph for patterns from the user's past scans.
    Returns a string injected into the scoring prompt to personalise verdicts.
    """
    if not _is_ready() or not user_id:
        return None
    try:
        import cognee
        from cognee import SearchType

        results = await cognee.search(
            f"user {user_id[:8]} high score verdicts platforms patterns winning bids",
            query_type=SearchType.GRAPH_COMPLETION,
        )
        if results:
            text = _extract_text(results[0])[:300]
            if text:
                return f"[Memory] Patterns from this user's past scans: {text}"
    except Exception as e:
        log.debug(f"Cognee user query failed (non-critical): {e}")
    return None
