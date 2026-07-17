-- Full Sift schema — run this once in Supabase SQL Editor
-- Safe to re-run (all statements use IF NOT EXISTS / OR REPLACE)

-- ── Scans ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scans (
  id           TEXT PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  skills       TEXT[]  DEFAULT '{}',
  hourly_rate  NUMERIC DEFAULT 0,
  experience   TEXT    DEFAULT 'mid',
  status       TEXT    DEFAULT 'processing',
  progress     TEXT    DEFAULT '',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scans_user_id ON scans(user_id);

-- ── Opportunities ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS opportunities (
  id              TEXT PRIMARY KEY,
  scan_id         TEXT REFERENCES scans(id) ON DELETE CASCADE,
  url             TEXT,
  title           TEXT,
  platform        TEXT,
  budget_min      NUMERIC,
  budget_max      NUMERIC,
  bid_count       INTEGER,
  posted_at       TIMESTAMPTZ,
  client_id       TEXT,
  sift_score      INTEGER DEFAULT 0,
  verdict         TEXT    DEFAULT 'SKIP',
  reasons         JSONB   DEFAULT '[]',
  red_flags       JSONB   DEFAULT '[]',
  proposal_angle  TEXT,
  is_demo         BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_opportunities_scan_id ON opportunities(scan_id);

-- ── Client profiles ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS client_profiles (
  client_id         TEXT PRIMARY KEY,
  platform          TEXT,
  total_spent       NUMERIC DEFAULT 0,
  hire_rate         NUMERIC DEFAULT 0,
  review_count      INTEGER DEFAULT 0,
  dispute_count     INTEGER DEFAULT 0,
  avg_rating        NUMERIC DEFAULT 0,
  avg_duration_days INTEGER DEFAULT 0,
  raw_data          JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ── Market rates ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS market_rates (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_tag    TEXT,
  platform     TEXT DEFAULT 'upwork',
  p25_rate     NUMERIC,
  median_rate  NUMERIC,
  p75_rate     NUMERIC,
  sample_count INTEGER,
  week_start   DATE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_market_rates_skill ON market_rates(skill_tag);

-- ── User profiles ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id      UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  skills       TEXT[]  DEFAULT '{}',
  hourly_rate  NUMERIC DEFAULT 0,
  experience   TEXT    DEFAULT 'mid',
  github_url   TEXT,
  bio          TEXT,
  onboarded    BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: users can only access their own profile
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile"   ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Auto-create a profile row whenever a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
