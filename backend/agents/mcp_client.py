"""
MCP client stub — no longer used.
Previously connected to the Bright Data MCP server via stdio.
Kept here as a placeholder to avoid import errors in any legacy code.
"""


async def fetch_url_via_mcp(url: str, max_chars: int = 4000) -> str | None:
    """No-op stub. Returns None — MCP is not configured."""
    return None


async def search_via_mcp(query: str, num_results: int = 10) -> list[dict] | None:
    """No-op stub. Returns None — MCP is not configured."""
    return None
