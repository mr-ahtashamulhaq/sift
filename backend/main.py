from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from routers import scan, opps, analyze, status
from routers import auth, users, jobs, suggestions, chat

app = FastAPI(title="Sift API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(scan.router)
app.include_router(opps.router)
app.include_router(analyze.router)
app.include_router(status.router)
app.include_router(jobs.router)
app.include_router(suggestions.router)
app.include_router(chat.router)


@app.api_route("/health", methods=["GET", "HEAD"])
async def health():
    return {
        "status": "ok",
        "service": "sift-api",
        "version": "2.0.0",
        "serper_configured": bool(settings.serper_api_key),
        "groq_configured": bool(settings.groq_api_key),
        "aiml_configured": bool(settings.aiml_api_key),
    }
