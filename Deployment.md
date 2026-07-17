# Sift Full-Stack Deployment Guide

This guide walks you through deploying Sift entirely on free-tier services. We will use **Supabase** for the database, **Render** for the Python/FastAPI backend, and **Vercel** for the Next.js frontend.

---

## 1. Database (Supabase)

You already have Supabase set up locally, but for production:
1. Go to [Supabase](https://supabase.com) and create a new project.
2. Go to **SQL Editor** and run the `backend/migrations/000_full_schema.sql` script to create all necessary tables and RLS policies.
3. Go to **Project Settings -> API** to get your `Project URL` and `service_role` secret key. You will need these for the backend.
4. Go to **Authentication -> Providers** and ensure Email/Password sign-in is enabled.

---

## 2. Backend (Render)

We will deploy the FastAPI backend using [Render's Free Web Service](https://render.com).

### Prerequisites
Make sure your project is pushed to GitHub. Render will deploy directly from your repository.

### Steps
1. Sign up/Log in to Render and click **New + -> Web Service**.
2. Connect your GitHub repository and select the `sift` repo.
3. Configure the service:
   - **Name**: `sift-backend` (or similar)
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. **Environment Variables**: Add the following keys (copy your actual values):
   - `SERPER_API_KEY` (from serper.dev)
   - `GROQ_API_KEY` (from console.groq.com)
   - `SUPABASE_URL` (your production Supabase URL)
   - `SUPABASE_SERVICE_KEY` (your production Supabase service_role key)
   - `CORS_ORIGINS` (set this to `https://your-frontend-url.vercel.app` once Vercel is deployed, use `*` temporarily if needed).
   - `PYTHON_VERSION` = `3.11.0` (Recommended to ensure compatibility)
5. Click **Create Web Service**. Wait for the build to finish. Once deployed, note your Render URL (e.g., `https://sift-backend.onrender.com`).

---

## 3. Frontend (Vercel)

We will deploy the Next.js frontend using [Vercel's Free Tier](https://vercel.com).

### Steps
1. Sign up/Log in to Vercel and click **Add New -> Project**.
2. Import your `sift` repository from GitHub.
3. Configure the project:
   - **Project Name**: `sift`
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Install Command**: `npm install`
4. **Environment Variables**: Add the following:
   - `NEXT_PUBLIC_API_URL` = `https://sift-backend.onrender.com` (Your Render backend URL).
5. Click **Deploy**. Vercel will build and deploy the Next.js app.
6. Once deployed, you will receive your production URL (e.g., `https://sift.vercel.app`).

---

## 4. Final Verification
1. **Update CORS:** Now that you have your Vercel URL, go back to your Render Dashboard -> Sift Backend -> Environment. Update `CORS_ORIGINS` to include your exact Vercel URL (e.g., `https://sift.vercel.app`).
2. Open your Vercel URL in your browser.
3. Create an account, connect your profile, and run a scan to ensure everything works end-to-end!
