import asyncio
import json
import logging
import groq
from config import settings
from ai.prompts import SYSTEM_PROMPT, USER_PROMPT, build_prompt_context

log = logging.getLogger(__name__)

FALLBACK_SCORE = {
    "sift_score": 50,
    "reasons": ["Analysis temporarily unavailable — data insufficient"],
    "red_flags": [],
    "proposal_angle": "Lead with your most relevant experience for this project.",
    "verdict": "risky",
}


def score_listing(listing: dict, client: dict | None, market: dict | None, user: dict) -> dict:
    if not settings.groq_api_key:
        log.error("Groq API key not configured")
        return {**FALLBACK_SCORE, "reasons": ["Groq API key not configured on the server"]}

    try:
        ctx = build_prompt_context(listing, client, market, user)
        prompt = USER_PROMPT.format(**ctx)

        groq_client = groq.Groq(api_key=settings.groq_api_key)
        msg = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,
            response_format={"type": "json_object"},
        )

        text = msg.choices[0].message.content.strip()
        # Strip accidental markdown fences
        if text.startswith("```"):
            text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()

        result = json.loads(text)

        # Clamp score to 0-100
        result["sift_score"] = max(0, min(100, int(result.get("sift_score", 50))))
        return result

    except (json.JSONDecodeError, IndexError, KeyError) as e:
        log.error("Groq scorer JSON parse error: %s", e)
        return FALLBACK_SCORE
    except Exception as e:
        log.error("Groq scorer error: %s", e)
        return FALLBACK_SCORE


async def score_listing_async(
    listing: dict,
    client: dict | None,
    market: dict | None,
    user: dict,
) -> dict:
    return await asyncio.to_thread(score_listing, listing, client, market, user)
