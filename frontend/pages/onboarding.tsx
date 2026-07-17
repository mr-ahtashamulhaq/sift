import { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { ArrowRight, Loader2 } from "lucide-react";
import { LogoIcon } from "@/components/Logo";
import { useAuth } from "@/lib/auth";
import { updateProfile } from "@/lib/api";
import AuthGuard from "@/components/AuthGuard";
import SkillInput from "@/components/SkillInput";

export default function Onboarding() {
  const { profile, refreshProfile } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [skills, setSkills] = useState<string[]>(profile?.skills || []);
  const [rate, setRate]     = useState(profile?.hourly_rate ? String(profile.hourly_rate) : "");
  const [exp, setExp]       = useState<"junior" | "mid" | "senior">(profile?.experience || "mid");
  const [github, setGithub] = useState(profile?.github_url || "");
  const [bio, setBio]       = useState(profile?.bio || "");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  async function finish() {
    setSaving(true);
    setSaveError("");
    try {
      await updateProfile({ skills, hourly_rate: parseFloat(rate) || 0, experience: exp, github_url: github || null, bio: bio || null, onboarded: true });
      await refreshProfile();
    } catch (e: unknown) {
      // Log but don't block — user can fix their profile in Settings
      console.error("Profile save failed:", e);
      setSaveError(e instanceof Error ? e.message : "Profile save failed — you can update it later in Settings.");
    } finally {
      setSaving(false);
    }
    // Always redirect to dashboard regardless of save outcome
    router.push("/app/dashboard");
  }

  const steps = [
    {
      title: "What are your skills?",
      sub: "Add up to 10 skills. These will be used to find relevant opportunities.",
      content: (
        <SkillInput skills={skills} onChange={setSkills} max={10} />
      ),
      canNext: skills.length > 0,
    },
    {
      title: "What's your target rate?",
      sub: "This helps Sift find the most relevant opportunities for your price range.",
      content: (
        <div className="stack">
          <div className="col-2">
            <div className="form-group">
              <label className="input-label">Hourly rate (USD)</label>
              <input type="number" value={rate} onChange={e => setRate(e.target.value)}
                placeholder="45" min="1" max="999" className="input" />
            </div>
            <div className="form-group">
              <label className="input-label">Experience level</label>
              <select value={exp} onChange={e => setExp(e.target.value as "junior" | "mid" | "senior")} className="input" style={{ cursor: "pointer" }}>
                <option value="junior">Junior (0–2 years)</option>
                <option value="mid">Mid-level (2–5 years)</option>
                <option value="senior">Senior (5+ years)</option>
              </select>
            </div>
          </div>
        </div>
      ),
      canNext: !!rate,
    },
    {
      title: "Tell us about yourself",
      sub: "Optional — helps the AI give more personalized project suggestions.",
      content: (
        <div className="stack">
          <div className="form-group">
            <label className="input-label">GitHub URL (optional)</label>
            <input type="url" value={github} onChange={e => setGithub(e.target.value)}
              placeholder="https://github.com/yourname" className="input" />
          </div>
          <div className="form-group">
            <label className="input-label">Short bio (optional)</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)}
              placeholder="e.g. Full-stack dev specializing in SaaS products..."
              rows={3} className="input" style={{ resize: "vertical" }} />
          </div>
          <p style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 300 }}>
            You can always update this later in Settings.
          </p>
        </div>
      ),
      canNext: true,
    },
  ];

  const s = steps[step];

  return (
    <AuthGuard>
      <Head><title>Setup your profile — Sift</title></Head>
      <div className="onboard-page">
        <div className="auth-glow" />
        <div className="onboard-card">
          <div className="auth-logo" style={{ marginBottom: 8 }}>
            <LogoIcon size={40} />
            <span className="auth-logo-text" style={{ color: "var(--text-1)", fontSize: 16 }}>
              SI<span style={{ color: "var(--gold)" }}>FT</span>
            </span>
          </div>

          <div className="step-indicator" style={{ marginTop: 20 }}>
            {steps.map((_, i) => (
              <div key={i} className={`step-dot${i <= step ? " step-dot-active" : ""}`} />
            ))}
          </div>

          <h2 style={{ fontFamily: "Space Grotesk, Inter, sans-serif", fontSize: 24, fontWeight: 600, marginBottom: 6, color: "var(--text-1)" }}>
            {s.title}
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-3)", fontWeight: 300, marginBottom: 24 }}>{s.sub}</p>

          {s.content}

          {saveError && (
            <div style={{ marginTop: 16, padding: "9px 12px", background: "var(--danger-bg)", border: "1px solid var(--danger-border)", borderRadius: "var(--radius)", fontSize: 12, color: "var(--danger)" }}>
              {saveError}
            </div>
          )}

          <div className="row-sb" style={{ marginTop: 28 }}>
            {step > 0
              ? <button className="btn btn-ghost" onClick={() => setStep(p => p - 1)}>← Back</button>
              : <div />}
            {step < steps.length - 1 ? (
              <button className="btn btn-primary" disabled={!s.canNext} onClick={() => setStep(p => p + 1)}>
                Continue <ArrowRight size={13} />
              </button>
            ) : (
              <button className="btn btn-primary" disabled={saving} onClick={finish}>
                {saving ? <><Loader2 size={13} style={{ animation: "spin 0.7s linear infinite" }} /> Saving...</> : "Start scanning →"}
              </button>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
