"""AI-powered project suggestions based on user profile and target score."""
import json
import groq
from config import settings

FALLBACK = [
    {
        "title": "Build a full-stack SaaS dashboard",
        "description": "Create a multi-tenant Next.js + Supabase application with auth, billing, and analytics.",
        "skills_gained": ["React", "TypeScript", "Supabase", "Stripe"],
        "estimated_hours": 40,
        "score_impact": "+8–12 points",
        "difficulty": "medium",
        "reason": "SaaS dashboards are in high demand and demonstrate full-stack ownership.",
    }
]

SYSTEM = """You are a freelance career coach specializing in helping developers build a portfolio
that wins more bids on Upwork, Freelancer, Guru, and similar platforms.
Respond ONLY in valid JSON — no prose, no markdown."""

def get_project_suggestions(
    user_skills: list[str],
    experience: str,
    hourly_rate: float,
    current_score: float | None,
    target_score: float = 80.0,
    github_url: str | None = None,
) -> list[dict]:
    if not settings.groq_api_key:
        print("[Suggestions] Groq API key not configured")
        return FALLBACK

    try:
        client = groq.Groq(api_key=settings.groq_api_key)
        prompt = f"""A {experience} freelancer with skills [{", ".join(user_skills)}] charges ${hourly_rate}/hr.
Current average bid win-score: {current_score or "unknown"}/100. Target: {target_score}/100.
{f"Their GitHub: {github_url}" if github_url else ""}

Suggest 4 concrete portfolio projects that would maximally increase their win rate on freelance platforms.
Each project should be buildable in 20–60 hours and directly target client pain points.

Return this JSON object:
{{
  "suggestions": [
    {{
      "title": "<project name>",
      "description": "<2-sentence description of what it does and why clients will love it>",
      "skills_gained": ["skill1", "skill2"],
      "estimated_hours": <int>,
      "score_impact": "<e.g. +10–15 points>",
      "difficulty": "easy" | "medium" | "hard",
      "reason": "<why this project will directly improve bid win rate>"
    }}
  ]
}}"""

        msg = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": SYSTEM},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,
            response_format={"type": "json_object"},
        )
        text = msg.choices[0].message.content.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()
        parsed = json.loads(text)
        if isinstance(parsed, list):
            return parsed
        return parsed.get("suggestions", FALLBACK)
    except Exception as e:
        print(f"[Suggestions] Error: {e}")
        return FALLBACK
