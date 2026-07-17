-- ============================================================
-- Sift demo seed data
-- Run this in the Supabase SQL editor ONCE.
-- All rows are tagged is_demo=true so the demo endpoint
-- (/opportunities/demo) returns them without a real scan.
-- ============================================================

-- 1. Demo scan row (fixed UUID so opportunities can reference it)
INSERT INTO scans (id, skills, hourly_rate, experience, status, progress)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  ARRAY['React','TypeScript','Node.js'],
  65,
  'mid',
  'complete',
  'Done'
) ON CONFLICT (id) DO NOTHING;

-- 2. Market rate for demo skill
INSERT INTO market_rates (id, skill_tag, platform, p25_rate, median_rate, p75_rate, sample_count, week_start)
VALUES (
  '00000000-0000-0000-0000-000000000010',
  'react', 'multi', 42, 58, 78, 34, CURRENT_DATE
) ON CONFLICT (id) DO NOTHING;

-- 3. Demo client profiles
INSERT INTO client_profiles (client_id, platform, total_spent, hire_rate, review_count, dispute_count, avg_rating, avg_duration_days)
VALUES
  ('demo-client-alpha',   'upwork',      62400, 94, 47, 0, 4.9, 18),
  ('demo-client-beta',    'upwork',      28900, 71, 23, 1, 4.6, 12),
  ('demo-client-gamma',   'freelancer',  11200, 55, 9,  2, 4.1, 7),
  ('demo-client-delta',   'guru',        3400,  40, 4,  0, 3.8, 5),
  ('demo-client-epsilon', 'upwork',      88000, 89, 62, 0, 4.8, 22),
  ('demo-client-zeta',    'upwork',      1200,  25, 2,  1, 3.2, 3)
ON CONFLICT (client_id) DO NOTHING;

-- 4. Demo opportunities (mix of GO / RISKY / SKIP)
INSERT INTO opportunities (
  id, scan_id, title, url, platform,
  budget_min, budget_max, bid_count, posted_at,
  client_id, sift_score, verdict, reasons, red_flags, proposal_angle, is_demo
) VALUES

-- ── GO ──────────────────────────────────────────────────────
(
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'Senior React + TypeScript Developer for SaaS Dashboard',
  'https://www.upwork.com/nx/jobs/search/?q=react+typescript+saas+dashboard&sort=recency',
  'upwork', 75, 95, 4,
  NOW() - INTERVAL '3 hours',
  'demo-client-alpha', 92, 'go',
  '["Only 4 bids — platform average is 23 at this stage", "Client has $62k spent, 94% hire rate, 0 disputes on record", "Budget of $75–95/hr is 30% above your target — strong margin"]',
  '[]',
  'Reference a specific SaaS product you''ve built and lead with the TypeScript architecture decision that shipped it.',
  true
),
(
  '10000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'React / Next.js Developer for FinTech Startup — Long Term',
  'https://www.upwork.com/nx/jobs/search/?q=react+nextjs+fintech+developer&sort=recency',
  'upwork', 60, 80, 7,
  NOW() - INTERVAL '1 hour',
  'demo-client-epsilon', 84, 'go',
  '["7 bids in the first hour — early entry advantage", "Client has $88k spent with an 89% hire rate across 62 jobs", "FinTech + Next.js is your strongest skill overlap this week"]',
  '[]',
  'Open with the specific performance metric you achieved on your most recent Next.js production app.',
  true
),
(
  '10000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000001',
  'TypeScript Full-Stack Engineer — Node + React (Remote)',
  'https://www.freelancer.com/jobs/javascript/',
  'freelancer', 55, 75, 11,
  NOW() - INTERVAL '5 hours',
  'demo-client-beta', 76, 'go',
  '["Budget aligns with your $65/hr target rate", "Client has $29k spent and a 71% hire rate — reliable payer", "Full-stack scope plays directly into your Node + React skill set"]',
  '[]',
  'Lead with your most complex full-stack architecture — they care more about system design than framework familiarity.',
  true
),

-- ── RISKY ───────────────────────────────────────────────────
(
  '10000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000001',
  'React Developer for E-commerce Platform Rebuild',
  'https://www.upwork.com/nx/jobs/search/?q=react+ecommerce+developer&sort=recency',
  'upwork', 35, 55, 19,
  NOW() - INTERVAL '8 hours',
  'demo-client-beta', 62, 'risky',
  '["Budget ceiling of $55/hr is 15% below your target", "19 bids already — above average competition for this category", "Client hire rate is 71% — acceptable but not strong"]',
  '["Budget below target rate"]',
  'Emphasise speed of delivery and mention a specific e-commerce project with measurable conversion impact.',
  true
),
(
  '10000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000001',
  'Frontend React Engineer — Ongoing Contract',
  'https://www.guru.com/d/jobs/q/react/',
  'guru', 40, 60, 14,
  NOW() - INTERVAL '12 hours',
  'demo-client-gamma', 54, 'risky',
  '["Rate range is tight — ceiling of $60 barely covers your target", "Client has 2 recorded disputes out of 9 jobs — worth noting", "14 bids after 12 hours suggests moderate competition"]',
  '["2 client disputes on record", "Below-average client spend ($11k total)"]',
  'Keep the proposal short and ask a clarifying question about the ongoing scope — it signals commitment without over-pitching.',
  true
),
(
  '10000000-0000-0000-0000-000000000006',
  '00000000-0000-0000-0000-000000000001',
  'React + Redux Developer for Dashboard Application',
  'https://www.peopleperhour.com/freelance-jobs?search=react+redux+developer',
  'peopleperhour', 45, 65, 22,
  NOW() - INTERVAL '18 hours',
  'demo-client-delta', 47, 'risky',
  '["22 bids after 18 hours — this listing is crowded", "Client only has $3.4k total spend — may be price-sensitive", "Redux is listed but the job may not need it — scope is vague"]',
  '["High bid count", "Low client spend history", "Vague scope definition"]',
  'Clarify scope upfront and propose a fixed-price discovery sprint rather than an open-ended contract.',
  true
),
(
  '10000000-0000-0000-0000-000000000007',
  '00000000-0000-0000-0000-000000000001',
  'React / Vue.js Developer for Internal Tool',
  'https://www.upwork.com/nx/jobs/search/?q=react+vue+developer+internal+tool&sort=recency',
  'upwork', 30, 50, 31,
  NOW() - INTERVAL '24 hours',
  'demo-client-gamma', 41, 'risky',
  '["Budget tops out at $50/hr — below your target by 23%", "31 bids after 24 hours — well above platform average", "Vue.js listed alongside React creates skill ambiguity"]',
  '["Budget significantly below target", "Very high competition"]',
  'Only bid if you have a strong Vue.js portfolio — otherwise the skill ambiguity will hurt your proposal.',
  true
),

-- ── SKIP ────────────────────────────────────────────────────
(
  '10000000-0000-0000-0000-000000000008',
  '00000000-0000-0000-0000-000000000001',
  'Frontend Developer for Simple Website',
  'https://www.freelancer.com/jobs/html-css-javascript/',
  'freelancer', 15, 30, 47,
  NOW() - INTERVAL '2 days',
  'demo-client-zeta', 28, 'skip',
  '["Budget of $15–30/hr is 54% below your target rate", "47 bids after 2 days — extremely crowded listing", "Client has only $1.2k total spend with a 25% hire rate"]',
  '["Budget far below target", "Extremely high competition", "Low client hire rate (25%)", "1 dispute in 2 jobs"]',
  'Skip — the economics do not work at your rate level.',
  true
),
(
  '10000000-0000-0000-0000-000000000009',
  '00000000-0000-0000-0000-000000000001',
  'React Landing Page — Quick Fix Needed',
  'https://www.upwork.com/nx/jobs/search/?q=react+landing+page+frontend&sort=recency',
  'upwork', 10, 25, 38,
  NOW() - INTERVAL '3 days',
  'demo-client-zeta', 19, 'skip',
  '["Fixed budget of $10–25 — this is project-rate, not hourly", "38 bids — saturated market with likely offshore competition", "Client has never completed a hire (0% hire rate)"]',
  '["Budget is project-rate not hourly", "Zero hire rate client", "Saturated bid pool"]',
  'Skip — client has never hired anyone from this platform.',
  true
),
(
  '10000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000001',
  'HTML/CSS/React Micro-tasks',
  'https://www.guru.com/d/jobs/q/react+frontend/',
  'guru', 8, 20, 63,
  NOW() - INTERVAL '4 days',
  'demo-client-delta', 11, 'skip',
  '["Micro-task rate ($8–20) is incompatible with senior-level billing", "63 bids — most saturated listing in this scan", "Undefined project scope signals scope-creep risk"]',
  '["Rate incompatible with experience level", "Highest bid count in scan", "No defined project scope", "Low client rating (3.8)"]',
  'Skip — this category targets entry-level freelancers.',
  true
);
