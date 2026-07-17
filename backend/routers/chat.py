"""
Opportunity chat endpoint — streams AI responses via Server-Sent Events.
Powered by Groq. Scoped to a specific opportunity so the AI has full context
to give actionable, data-grounded answers.
"""
import json
import logging
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from groq import AsyncGroq
from config import settings
from middleware.auth import get_current_user

router = APIRouter(prefix="/chat", tags=["chat"])
log = logging.getLogger(__name__)

CHAT_SYSTEM = """\
You are Sift, a freelance bid intelligence assistant with deep expertise in \
freelance markets, bid strategy, proposal writing, and client evaluation.

You have already scored and analyzed a specific job opportunity (context below). \
Answer the user's questions about it with direct, actionable advice.

Rules:
- Be concise and direct. No filler phrases like "Great question!" or "Certainly!".
- Lead with the answer, not caveats.
- Use the specific numbers from the opportunity context (score, bid count, budget, etc.).
- Flag risks clearly but don't catastrophize.
- Keep responses under 250 words unless writing a full proposal.

CRITICAL RULES FOR WRITING PROPOSALS:
- NEVER use placeholder brackets like [Client's Name], [Your Name], [insert X], [specific product], or any [bracketed text]. Never. Not once.
- Do NOT write a formal letter. Upwork proposals are conversational, not business letters. No "Dear [Name]", no "Best regards", no sign-off lines.
- Do NOT invent details you don't have. If the client's name is unknown, don't reference it — just open strong without it.
- Your first sentence must be the proposal_angle from the context, adapted naturally into prose. Do not restate the job title back at the client.
- Reference real numbers from the context: bid count, budget range, score reasons. These are what make the proposal specific.
- Write in first person as the freelancer. Confident, specific, short. 3–4 sentences max for an opening unless asked for a full proposal.
- A full proposal is 3 short paragraphs: opening hook (from proposal_angle), relevant experience, and a clear call to action. Still no placeholders.
- NEVER mention Sift Score, verdict (GO/RISKY/SKIP), or any Sift internal metrics in a proposal. These are the freelancer's private intelligence — the client must never see them."""


def _build_context_block(opp: dict) -> str:
    parts = ["## Opportunity Context"]
    parts.append(f"Title: {opp.get('title', 'Unknown')}")
    parts.append(f"Platform: {opp.get('platform', 'unknown').capitalize()}")
    parts.append(f"Sift Score: {opp.get('sift_score', 'N/A')}/100")
    parts.append(f"Verdict: {opp.get('verdict', 'N/A').upper()}")

    if opp.get("budget_min") and opp.get("budget_max"):
        parts.append(f"Budget: ${opp['budget_min']}–${opp['budget_max']}/hr")
    elif opp.get("budget_max"):
        parts.append(f"Budget: up to ${opp['budget_max']}/hr")

    if opp.get("bid_count") is not None:
        parts.append(f"Competing bids so far: {opp['bid_count']}")

    if opp.get("reasons"):
        parts.append("Why to bid: " + "; ".join(opp["reasons"]))

    if opp.get("red_flags"):
        parts.append("Red flags: " + "; ".join(opp["red_flags"]))

    if opp.get("proposal_angle"):
        parts.append(f"Suggested opening line: {opp['proposal_angle']}")

    return "\n".join(parts)


class ChatMsg(BaseModel):
    role: str   # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMsg]
    opportunity_context: dict


@router.post("/opportunity")
async def chat_opportunity(req: ChatRequest, _user=Depends(get_current_user)):
    if not settings.groq_api_key:
        raise HTTPException(503, "Chat unavailable — Groq API key not configured")

    if not req.messages:
        raise HTTPException(400, "No messages provided")

    client = AsyncGroq(api_key=settings.groq_api_key)

    system_prompt = CHAT_SYSTEM + "\n\n" + _build_context_block(req.opportunity_context)
    messages = [{"role": "system", "content": system_prompt}]
    messages += [{"role": m.role, "content": m.content} for m in req.messages[-10:]]

    async def _generate():
        try:
            stream = await client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages,
                max_tokens=600,
                temperature=0.7,
                stream=True,
            )
            async for chunk in stream:
                delta = chunk.choices[0].delta.content or ""
                if delta:
                    yield f"data: {json.dumps({'text': delta})}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            log.error(f"Chat stream error: {e}")
            yield f"data: {json.dumps({'error': 'Chat failed — please try again'})}\n\n"

    return StreamingResponse(
        _generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
