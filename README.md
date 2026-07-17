<div align="center">

# 🔍 Sift - Freelance Bid Intelligence

**Stop bidding blind. Start winning.**

Sift scans live job listings across **5 platforms**, scores every opportunity **0–100** against your specific profile, and tells you exactly which jobs are worth bidding on — before you write a single word.

---

[![Live Demo](https://img.shields.io/badge/🚀%20Live%20Demo-sift.vercel.app-10b981?style=flat-square&logo=vercel)](https://sift.vercel.app?demo=true)
[![API Docs](https://img.shields.io/badge/📖%20API%20Docs-Swagger-f59e0b?style=flat-square)](https://sift-backend-production.up.railway.app/docs)
[![License](https://img.shields.io/badge/License-MIT-6366f1?style=flat-square)](LICENSE)

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.116-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![Groq](https://img.shields.io/badge/Groq-Llama%203.3%2070B-f97316?style=flat-square)](https://groq.com)
[![Serper](https://img.shields.io/badge/Serper-Google%20SERP%20API-3b82f6?style=flat-square)](https://serper.dev)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20+%20Auth-3ecf8e?style=flat-square&logo=supabase)](https://supabase.com)
[![Python](https://img.shields.io/badge/Python-3.11+-blue?style=flat-square&logo=python)](https://python.org)

</div>

---

## 🚨 The Problem

Freelancers waste hours writing proposals for jobs they won't win — too many competing bids, clients who never hire, budgets that don't match their rate. The data that would change those odds *exists*: bid counts, client spend history, hire rates, dispute records. It's hidden behind bot protection, scattered across five platforms, and invisible to anyone without a pipeline to pull it.

> **Sift fixes this.** It gives you the same intelligence a platform insider would have — in under 30 seconds.

---

## ✨ What it Does

| Feature | Description |
|---|---|
| 🎯 **Personalised scoring** | Every listing scored 0–100 against your skill levels, niche, and target rate — not a generic market score |
| 🧠 **Skill proficiency** | Set your level per skill (Beginner / Competent / Expert) — the score weights skill depth against what each listing requires |
| 🔎 **Niche matching** | Describe your specialisation in one line — proposal angles are generated to reflect your specific domain |
| 📁 **Portfolio enrichment** | Link your GitHub or portfolio — Sift scrapes it and the AI references your actual work in scoring |
| 🌐 **Live SERP scan** | Queries all five platforms simultaneously: Upwork, Freelancer, Guru, PeoplePerHour, Toptal |
| 👤 **Client intelligence** | Reads client history behind bot protection: total spend, hire rate, reviews, dispute record |
| ⚡ **Sift Score** | GO / RISKY / SKIP verdict with specific data-backed reasons and red flags |
| ✍️ **Proposal angle** | A literal first sentence for your proposal, built from the listing, client history, and your background |
| 💬 **AI Chat** | Ask anything about an opportunity — the AI has full context and answers with the actual data |
| 🧩 **Cognee memory** | Every scan builds a knowledge graph. Future scans use prior client intelligence to sharpen scores |
| 🕘 **Scan history** | All scans saved to your account with full results |

---

## 🛠️ How the Technologies Are Used

### 🌐 Serper.dev — the data layer

| Tool | How it is used |
|---|---|
| **SERP API** | Live Google search to surface fresh listings across all five platforms on every scan |
| **Direct scraping** | Structured extraction of job details: bid counts, budgets, required skills, post dates |
| **Profile fetching** | Reads client profiles (spend, hire rate, disputes) using browser-like HTTP requests |

### 🤖 Groq + Llama 3.3 70B — the AI engine

Every listing is scored by **Llama 3.3 70B** via Groq's ultra-fast inference, using live scraped data, the user's skill profile, and Cognee memory context. The model writes the verdict, reasons, red flags, and proposal angle — all grounded in real numbers.

Groq powers:
- **AI Scoring** — win probability + verdict (GO / RISKY / SKIP) per listing
- **AI Chat** — streams real-time answers about any opportunity via SSE
- **Project Suggestions** — personalized portfolio recommendations

### 🧩 Cognee — the memory layer

After every completed scan, results are stored into a per-user knowledge graph. On the next scan, Cognee queries that graph for prior client intelligence and patterns from the user's own history. The product gets smarter with each use.

---

## 🏗️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| 🖥️ Frontend | Next.js 16, React 19, TypeScript | App UI, SSR, routing |
| ⚙️ Backend | FastAPI, Python 3.11 | REST API, background tasks |
| 🗄️ Database & Auth | Supabase (PostgreSQL + RLS) | User accounts, scan history, opportunities |
| 🌐 Scraping | Serper.dev SERP + direct httpx scraping | Live job data extraction |
| 🤖 AI Scoring & Chat | Groq — Llama 3.3 70B Versatile | Win probability scoring, streaming chat |
| 🧩 Memory | Cognee (knowledge graph) | Per-user and per-client intelligence |
| 📁 Portfolio | GitHub API + direct httpx scraping | Portfolio context for scoring |
| 🚀 Deployment | Vercel (frontend) + Railway (backend) | Production hosting |

---

## 📁 Project Structure

```
Sift/
├── backend/
│   ├── agents/
│   │   ├── pipeline.py      # Main orchestration: SERP → scrape → score → save
│   │   ├── serp.py          # Serper.dev SERP API
│   │   ├── scraper.py       # Direct job listing scraper
│   │   ├── unlocker.py      # Direct client profile scraper
│   │   ├── portfolio.py     # GitHub API + direct portfolio scraping
│   │   └── mcp_client.py    # (legacy stub — no longer used)
│   ├── ai/
│   │   ├── scorer.py        # Groq + Llama 3.3 70B scoring
│   │   └── prompts.py       # Prompt templates (skill levels, niche, memory)
│   ├── memory/
│   │   └── cognee_memory.py # Cognee knowledge graph store + query
│   ├── middleware/          # JWT auth verification
│   ├── migrations/          # Supabase SQL migrations
│   ├── models/              # Pydantic schemas
│   ├── routers/
│   │   ├── scan.py          # POST /scan
│   │   ├── opps.py          # GET /opportunities/:id
│   │   ├── chat.py          # POST /chat/opportunity (streaming SSE)
│   │   ├── users.py         # GET/PUT /users/me
│   │   ├── auth.py          # Register, login, password reset
│   │   ├── jobs.py          # POST /jobs/analyze
│   │   └── suggestions.py   # POST /suggestions
│   ├── config.py            # Environment settings
│   ├── database.py          # Supabase helpers
│   └── main.py              # FastAPI entry point
└── frontend/
    ├── components/
    │   ├── ScanForm.tsx      # Skill chips with proficiency levels + niche + portfolio
    │   ├── OpportunityCard.tsx
    │   ├── SiftScore.tsx     # Score display component
    │   ├── AppShell.tsx      # Sidebar navigation shell
    │   └── ...
    ├── lib/                  # API client, auth context, theme
    ├── pages/
    │   ├── app/
    │   │   ├── scan.tsx      # Scan page
    │   │   ├── chat.tsx      # AI Chat (3-column layout, persistent threads)
    │   │   ├── opportunity/[id].tsx
    │   │   ├── history.tsx
    │   │   ├── settings.tsx  # GitHub + portfolio URL, skill profile
    │   │   └── dashboard.tsx
    │   └── ...
    └── styles/               # Global CSS design system
```

---

## 🚀 Getting Started

### Prerequisites

> **Ready to deploy?** Check out the [Full-Stack Deployment Guide](Deployment.md) for step-by-step instructions on hosting Sift for free on Vercel and Railway.

| Requirement | Notes |
|---|---|
| 🐍 Python 3.11+ | Backend runtime |
| 🟢 Node.js 18+ | Frontend runtime |
| 🗄️ [Supabase](https://supabase.com) project | Free tier works fine |
| 🤖 [Groq](https://console.groq.com) API key | Free tier available |
| 🌐 [Serper.dev](https://serper.dev) API key | 2,500 free credits — no credit card needed |

---

### 🔧 Backend Setup

```bash
# 1. Enter backend directory
cd backend

# 2. Create virtual environment
python -m venv venv

# 3. Activate it
venv\Scripts\activate        # Windows
source venv/bin/activate     # macOS / Linux

# 4. Install dependencies
pip install -r requirements.txt
```

Create `backend/.env` (copy from `.env.example`):

```env
# Serper.dev — Google SERP API (free, get key at https://serper.dev)
SERPER_API_KEY=your_serper_api_key_here

# Groq — get your key at console.groq.com (free tier available)
GROQ_API_KEY=gsk_...

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJ...

# App
CORS_ORIGINS=http://localhost:3000,https://sift.vercel.app
PORT=8000
```

Run the Supabase migration once in your project SQL Editor:
```
backend/migrations/000_full_schema.sql
```

Then start the server:
```bash
uvicorn main:app --reload
```

> 📍 API → `http://localhost:8000`  
> 📖 Swagger → `http://localhost:8000/docs`

---

### 🎨 Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

```bash
npm run dev
```

> 📍 App → `http://localhost:3000`

---

## 📡 API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | — | Service health check |
| `POST` | `/auth/register` | — | Create account |
| `POST` | `/auth/login` | — | Sign in |
| `POST` | `/auth/forgot-password` | — | Send password reset |
| `POST` | `/auth/reset-password` | — | Set new password |
| `GET` | `/users/me` | ✅ JWT | Get profile |
| `PUT` | `/users/me` | ✅ JWT | Update profile (skills, rate, GitHub URL, portfolio URL) |
| `POST` | `/scan` | ✅ JWT | Start scan (skills with levels, niche, rate, portfolio URLs) |
| `GET` | `/opportunities/{scan_id}` | ✅ JWT | Poll scan results |
| `GET` | `/scans/history` | ✅ JWT | User scan history |
| `POST` | `/jobs/analyze` | ✅ JWT | Analyze a single job URL or description |
| `POST` | `/chat/opportunity` | ✅ JWT | Streaming AI chat with opportunity context (SSE) |
| `POST` | `/suggestions` | ✅ JWT | Get AI project suggestions |

---

## 🔑 Environment Variables

### Backend

| Variable | Required | Description |
|---|---|---|
| `SERPER_API_KEY` | ✅ Yes | Serper.dev API key — powers live SERP search |
| `GROQ_API_KEY` | ✅ Yes | Groq API key — powers AI scoring + chat (Llama 3.3 70B) |
| `SUPABASE_URL` | ✅ Yes | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | ✅ Yes | Supabase service role key |
| `AIML_API_KEY` | ⚪ Optional | AI/ML API key — enables Cognee knowledge graph memory |
| `CORS_ORIGINS` | ⚪ Optional | Comma-separated allowed origins (default: `http://localhost:3000`) |
| `PORT` | ⚪ Optional | Server port (default: `8000`) |

### Frontend

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | ✅ Yes | Backend API base URL |

---

---

## 📄 License

[MIT](LICENSE) — free to use, fork, and build on.

---

<div align="center">

Made with ❤️ by the **Sift Team**

[🚀 Live Demo](https://sift.vercel.app?demo=true) · [📖 API Docs](https://sift-backend-production.up.railway.app/docs)

</div>
