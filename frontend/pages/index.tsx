import { useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { Search, BarChart3, Sparkles, CheckCircle, XCircle, ArrowRight, Database, ShieldCheck, TrendingUp, Target, Globe, Clock, DollarSign } from "lucide-react";
import SiftScore from "@/components/SiftScore";
import ThemeToggle from "@/components/ThemeToggle";
import { LogoIcon } from "@/components/Logo";

const PLATFORMS = ["Upwork", "Freelancer", "Guru", "PeoplePerHour", "Toptal"];

const FEATURES = [
  {
    Icon: Search,
    color: "var(--gold)", bg: "var(--gold-muted)", glow: "rgba(59,130,246,0.20)",
    accent: "#3b82f6",
    title: "Real-time discovery",
    metric: "5 platforms · live SERP",
    desc: "SERP API scans Upwork, Freelancer, Guru, PeoplePerHour and Toptal the moment you run a scan. No cached results, no stale listings.",
  },
  {
    Icon: BarChart3,
    color: "var(--go)", bg: "rgba(16,185,129,0.12)", glow: "rgba(16,185,129,0.20)",
    accent: "#10b981",
    title: "Competitive intel",
    metric: "avg 23 bids tracked per listing",
    desc: "Bid counts, client spend, hire rates, and dispute records — scraped live so you always know the real competition.",
  },
  {
    Icon: Sparkles,
    color: "#a78bfa", bg: "rgba(167,139,250,0.12)", glow: "rgba(167,139,250,0.20)",
    accent: "#a78bfa",
    title: "AI scoring",
    metric: "0 – 100 win score",
    desc: "Best-in-class AI agents score each listing with data-backed reasoning. GO, RISKY, or SKIP — clear in under a second.",
  },
  {
    Icon: TrendingUp,
    color: "#60a5fa", bg: "rgba(96,165,250,0.10)", glow: "rgba(96,165,250,0.20)",
    accent: "#60a5fa",
    title: "Market rate data",
    metric: "P25 / P50 / P75 benchmarks",
    desc: "Live percentile benchmarks for your exact skill stack. Know if your rate is competitive before you write a single word.",
  },
  {
    Icon: ShieldCheck,
    color: "var(--warn)", bg: "var(--warn-bg)", glow: "rgba(245,158,11,0.20)",
    accent: "#f59e0b",
    title: "Client due diligence",
    metric: "spend · hire rate · disputes",
    desc: "Reads client history behind bot protection — total spend, hire rate, review count, and dispute records pulled automatically.",
  },
  {
    Icon: Target,
    color: "var(--danger)", bg: "var(--danger-bg)", glow: "rgba(239,68,68,0.20)",
    accent: "#ef4444",
    title: "Bid timing signals",
    metric: "< 5 bids = early-entry flag",
    desc: "Flags listings where bidding is still thin so you get in before the competition spikes — the single biggest win-rate lever.",
  },
];

const STEPS = [
  { num: "01", Icon: Target,   color: "var(--gold)",   title: "Enter your skills",  desc: "Tell Sift what you do and your target hourly rate." },
  { num: "02", Icon: Globe,    color: "var(--go)",     title: "Live SERP scan",     desc: "SERP API queries Google in real time across 5 major freelance platforms." },
  { num: "03", Icon: Database, color: "#60a5fa",       title: "Deep extraction",    desc: "Web Scraper + Web Unlocker pull bids, budgets, and client history." },
  { num: "04", Icon: Sparkles, color: "#a78bfa",       title: "AI ranking",         desc: "Our AI agents score each listing 0–100 with number-backed reasoning." },
];

const TEAM = [
  {
    initials: "AH",
    name: "Muhammad Ahtasham ul Haq",
    role: "Team Lead · Full-stack Engineer",
    bio: "Architected the full platform from data pipeline to AI scoring layer. Turned live scraping + LLM reasoning into a real-time decision engine for freelancers.",
    avatarColor: "#3b82f6",
  },
  {
    initials: "SF",
    name: "Sift Team",
    role: "Open Source · Built for Freelancers",
    bio: "Sift is open-source, free to use, and built to give every freelancer the competitive intelligence that was previously impossible to get.",
    avatarColor: "#a78bfa",
  },
];

const PAIN = [
  "Spending hours on bids that never get a reply",
  "Losing to lower bids you never knew existed",
  "Writing proposals for clients who haven't hired in months",
];

export default function Landing() {
  const router = useRouter();

  useEffect(() => {
    if (router.query.demo === "true") {
      router.replace("/app/scan?demo=true");
    }
  }, [router.query.demo]);

  useEffect(() => {
    const nav = document.querySelector(".lp-nav");
    const onScroll = () => nav?.classList.toggle("lp-nav-scrolled", window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add("lp-revealed");
            observer.unobserve(e.target);
          }
        });
      },
      { threshold: 0.06, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll(".lp-reveal").forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <Head>
        <title>Sift — Win more freelance bids</title>
        <meta name="description" content="AI-powered bid intelligence for freelancers. Know which jobs to bid on before writing a single word." />
      </Head>

      {/* ── NAV ── */}
      <nav className="lp-nav">
        <div className="lp-wrap lp-nav-inner">
          <Link href="/" className="lp-logo">
            <LogoIcon size={30} />
            <span className="lp-logo-text">SI<span className="lp-logo-accent">FT</span></span>
          </Link>
          <div className="lp-nav-end">
            <ThemeToggle />
            <Link href="/login" className="lp-nav-link">Sign in</Link>
            <Link href="/register" className="lp-btn-nav">
              Get started <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="lp-hero">
        <div className="lp-hero-glow" />
        <div className="lp-hero-grid" />
        <div className="lp-orb lp-orb-1" />
        <div className="lp-orb lp-orb-2" />
        <div className="lp-orb lp-orb-3" />

        <div className="lp-wrap lp-hero-split">
          {/* Left */}
          <div className="lp-hero-left">
            <div className="lp-badge lp-anim-1">
              <span className="lp-badge-dot" />
              ✨ Free to use · Open Source · Built for Freelancers
            </div>

            <h1 className="lp-h1 lp-anim-2">
              Stop bidding<br />
              blind.{" "}
              <span className="lp-h1-accent">Start<br />winning.</span>
            </h1>

            <div className="lp-pain lp-anim-3">
              {PAIN.map(p => (
                <div key={p} className="lp-pain-item">
                  <span className="lp-pain-x"><XCircle size={14} /></span>
                  {p}
                </div>
              ))}
            </div>

            <div className="lp-hero-ctas lp-anim-4">
              <Link href="/register" className="lp-cta-primary">
                Start for free <ArrowRight size={14} />
              </Link>
              <Link href="/login" className="lp-cta-ghost">Sign in</Link>
            </div>

            <p className="lp-hero-byline lp-anim-4">Free to use · No credit card required</p>
          </div>

          {/* Right — Product preview */}
          <div className="lp-hero-right lp-anim-5">
            <div className="lp-preview">
              <div className="lp-preview-bar">
                <span className="lp-dot lp-dot-r" />
                <span className="lp-dot lp-dot-y" />
                <span className="lp-dot lp-dot-g" />
                <span className="lp-preview-url">sift.app · scan results</span>
                <span className="lp-preview-live">
                  <span className="lp-preview-live-dot" />
                  live
                </span>
              </div>
              <div className="lp-scan-bar-wrap">
                <div className="lp-scan-bar" />
              </div>
              <div className="lp-preview-body">
                {/* Score summary row */}
                <div className="lp-preview-summary">
                  <span className="lp-sum-chip lp-sum-go">3 GO</span>
                  <span className="lp-sum-chip lp-sum-warn">4 RISKY</span>
                  <span className="lp-sum-chip lp-sum-skip">3 SKIP</span>
                  <span className="lp-sum-total">10 opportunities found</span>
                </div>
                {/* Best card */}
                <div className="lp-mock">
                  <div className="lp-mock-best">★ Best match</div>
                  <div className="lp-mock-top">
                    <SiftScore score={82} size="lg" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="lp-mock-badges">
                        <span className="lp-tag lp-tag-go">GO</span>
                        <span className="lp-tag lp-tag-platform">upwork</span>
                        <span className="lp-tag lp-tag-meta">$75–95/hr · 4 bids</span>
                      </div>
                      <p className="lp-mock-title">Senior React + TypeScript Developer for SaaS Dashboard</p>
                    </div>
                  </div>
                  <div className="lp-mock-reasons">
                    {[
                      "Only 4 bids — platform average is 23 at this stage",
                      "Client has $62k spent, 94% hire rate, 0 disputes",
                      "Your rate sits at the P57 percentile for React",
                    ].map((r, i) => (
                      <div key={i} className="lp-mock-reason">
                        <CheckCircle size={11} color="var(--go)" style={{ flexShrink: 0, marginTop: 2 }} />
                        {r}
                      </div>
                    ))}
                  </div>
                  <div className="lp-mock-tip">
                    <p className="lp-mock-tip-lbl">AI Proposal Tip</p>
                    <p className="lp-mock-tip-text">&ldquo;Lead with the TypeScript architecture decision that shipped your last SaaS product.&rdquo;</p>
                  </div>
                </div>
                {/* Ghost of second card */}
                <div className="lp-mock-ghost">
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 8, background: "rgba(245,158,11,0.10)", border: "1px solid rgba(245,158,11,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontFamily: "Space Grotesk", fontWeight: 700, fontSize: 13, color: "#f59e0b" }}>61</span>
                    </div>
                    <div>
                      <div className="lp-mock-badges" style={{ marginBottom: 4 }}>
                        <span className="lp-tag lp-tag-warn">RISKY</span>
                        <span className="lp-tag lp-tag-platform">freelancer</span>
                      </div>
                      <p className="lp-mock-ghost-title">Full-Stack Developer Needed for E-commerce...</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PLATFORM MARQUEE ── */}
      <div className="lp-marquee-section">
        <p className="lp-marquee-label">Scanning live on</p>
        <div className="lp-marquee">
          <div className="lp-marquee-track">
            {[...PLATFORMS, ...PLATFORMS, ...PLATFORMS].map((p, i) => (
              <div key={i} className="lp-marquee-item">
                <span className="lp-marquee-dot" />
                {p}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── STATS STRIP ── */}
      <div className="lp-stats-strip">
        <div className="lp-wrap lp-stats-inner">
          {[
            { Icon: Globe,       n: "5",     l: "Platforms scanned",  color: "var(--gold)" },
            { Icon: Database,    n: "4",     l: "Live data sources",   color: "var(--go)"   },
            { Icon: Sparkles,    n: "0–100", l: "AI win score",        color: "#a78bfa"      },
            { Icon: Clock,       n: "<30s",  l: "Per full scan",       color: "var(--warn)" },
            { Icon: DollarSign,  n: "P75",   l: "Market rate insight", color: "#60a5fa"      },
          ].map((s, i) => (
            <div key={s.l} className="lp-stat lp-reveal" data-delay={String(i + 1)}>
              <div className="lp-stat-icon" style={{ color: s.color }}>
                <s.Icon size={18} />
              </div>
              <span className="lp-stat-n" style={{ color: s.color }}>{s.n}</span>
              <span className="lp-stat-l">{s.l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <section className="lp-sec lp-sec-alt">
        <div className="lp-wrap">
          <div className="lp-sec-hd lp-reveal">
            <p className="lp-sec-lbl">How it works</p>
            <h2 className="lp-sec-h2">From skills to ranked results in 30 seconds</h2>
            <p className="lp-sec-p">Four steps. Live Serper SERP. Best-in-class AI agents. No guesswork.</p>
          </div>
          <div className="lp-steps">
            {STEPS.map((s, i) => (
              <div key={s.num} className="lp-step lp-reveal" data-delay={String(i + 1)}>
                <div className="lp-step-num" style={{ color: s.color }}>{s.num}</div>
                <div className="lp-step-icon" style={{ color: s.color, borderColor: `${s.color}33`, background: `${s.color}12` }}>
                  <s.Icon size={20} />
                </div>
                <h3 className="lp-step-title">{s.title}</h3>
                <p className="lp-step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES BENTO ── */}
      <section className="lp-sec">
        <div className="lp-wrap">
          <div className="lp-sec-hd lp-reveal">
            <p className="lp-sec-lbl">Why Sift</p>
            <h2 className="lp-sec-h2">Intelligence nobody else has</h2>
            <p className="lp-sec-p">
              Anyone can paste a job into AI. Sift gives you live bid counts,
              client spend history, and market rates before you write a word.
            </p>
          </div>
          <div className="lp-bento">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className={`lp-bento-card lp-bento-card-${i + 1} lp-reveal`}
                data-delay={String((i % 2) + 1)}
                style={{
                  "--feat-glow": f.glow,
                  "--card-accent": f.accent,
                } as React.CSSProperties}
              >
                <div className="lp-bento-top">
                  <div className="lp-feat-icon" style={{ background: f.bg, color: f.color }}>
                    <f.Icon size={18} />
                  </div>
                  <span className="lp-bento-metric" style={{ color: f.color }}>
                    {f.metric}
                  </span>
                </div>
                <h3 className="lp-feat-title">{f.title}</h3>
                <p className="lp-feat-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section className="lp-sec lp-sec-alt">
        <div className="lp-wrap">
          <div className="lp-sec-hd lp-reveal">
            <p className="lp-sec-lbl">About us</p>
            <h2 className="lp-sec-h2">Built by freelancers, for freelancers</h2>
            <p className="lp-sec-p">
              We built Sift because we were tired of spending hours researching bids manually.
              Now we spend that time actually winning them.
            </p>
          </div>
          <div className="lp-team">
            {TEAM.map((m, i) => (
              <div key={m.name} className="lp-team-card lp-reveal" data-delay={String(i + 1)}>
                <div className="lp-team-avatar" style={{ background: `${m.avatarColor}18`, border: `1px solid ${m.avatarColor}44`, color: m.avatarColor }}>
                  {m.initials}
                </div>
                <h3 className="lp-team-name">{m.name}</h3>
                <p className="lp-team-role" style={{ color: m.avatarColor }}>{m.role}</p>
                <p className="lp-team-bio">{m.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="lp-cta-section">
        <div className="lp-cta-mesh" />
        <div className="lp-cta-glow-a" />
        <div className="lp-cta-glow-b" />
        <div className="lp-wrap lp-cta-body">
          <div className="lp-cta-icon lp-reveal"><LogoIcon size={40} /></div>
          <h2 className="lp-cta-h2 lp-reveal" data-delay="1">
            Ready to stop guessing?
          </h2>
          <p className="lp-cta-p lp-reveal" data-delay="2">
            Create your free account and scan live listings across 5 platforms in under 30 seconds.
          </p>
          <div className="lp-hero-ctas lp-reveal" data-delay="3" style={{ justifyContent: "center" }}>
            <Link href="/register" className="lp-cta-primary lp-cta-primary-lg">
              Create free account <ArrowRight size={15} />
            </Link>
            <Link href="/login" className="lp-cta-btn-ghost">I have an account</Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="lp-wrap lp-footer-inner">
          <Link href="/" className="lp-logo">
            <LogoIcon size={26} />
            <span className="lp-logo-text" style={{ fontSize: 13 }}>SI<span className="lp-logo-accent">FT</span></span>
          </Link>
          <p className="lp-footer-copy">© 2026 Sift. All rights reserved.</p>
          <div className="lp-footer-links">
            <Link href="/login" className="lp-footer-link">Sign in</Link>
            <Link href="/register" className="lp-footer-link">Register</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
