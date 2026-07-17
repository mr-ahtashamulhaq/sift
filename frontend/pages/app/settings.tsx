import { useState, useEffect } from "react";
import Head from "next/head";
import { Loader2, CheckCircle, Eye, EyeOff, UserCircle, Code2, DollarSign, Lock, Shield, Link2, Globe } from "lucide-react";
import AppShell from "@/components/AppShell";
import AuthGuard from "@/components/AuthGuard";
import { useAuth } from "@/lib/auth";
import { updateProfile, resetPassword } from "@/lib/api";
import PasswordStrength from "@/components/PasswordStrength";
import SkillInput from "@/components/SkillInput";

export default function SettingsPage() {
  const { profile, refreshProfile } = useAuth();

  const [skills, setSkills]       = useState<string[]>([]);
  const [rate, setRate]           = useState("");
  const [exp, setExp]             = useState<"junior" | "mid" | "senior">("mid");
  const [github, setGithub]       = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [bio, setBio]             = useState("");
  const [displayName, setDN]      = useState("");

  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [error, setError]         = useState("");

  // Password change
  const [newPwd, setNewPwd]       = useState("");
  const [cfmPwd, setCfmPwd]       = useState("");
  const [showNew, setShowNew]     = useState(false);
  const [showCfm, setShowCfm]     = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdSaved, setPwdSaved]   = useState(false);
  const [pwdError, setPwdError]   = useState("");

  useEffect(() => {
    if (!profile) return;
    setSkills(profile.skills || []);
    setRate(profile.hourly_rate ? String(profile.hourly_rate) : "");
    setExp(profile.experience || "mid");
    setGithub(profile.github_url || "");
    setPortfolio((profile as unknown as { portfolio_url?: string }).portfolio_url || "");
    setBio(profile.bio || "");
    setDN(profile.display_name || "");
  }, [profile]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await updateProfile({
        display_name: displayName || null,
        skills,
        hourly_rate: parseFloat(rate) || 0,
        experience: exp,
        github_url:    github    || null,
        bio:           bio       || null,
        ...(portfolio ? { portfolio_url: portfolio } : {}),
      });
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPwdError("");
    if (newPwd.length < 8) { setPwdError("Password must be at least 8 characters"); return; }
    if (newPwd !== cfmPwd) { setPwdError("Passwords do not match"); return; }
    const token = typeof window !== "undefined" ? localStorage.getItem("sb_token") : null;
    if (!token) { setPwdError("Not authenticated — please sign in again"); return; }
    setPwdSaving(true);
    try {
      await resetPassword(token, newPwd);
      setPwdSaved(true);
      setNewPwd(""); setCfmPwd("");
      setTimeout(() => setPwdSaved(false), 3000);
    } catch (e: unknown) {
      setPwdError(e instanceof Error ? e.message : "Password update failed");
    } finally {
      setPwdSaving(false);
    }
  }

  return (
    <AuthGuard>
      <Head><title>Settings — Sift</title></Head>
      <AppShell>
        <div className="page-header">
          <div>
            <h1 style={{ fontFamily: "Space Grotesk, Inter, sans-serif", fontSize: 26, fontWeight: 600, color: "var(--text-1)", marginBottom: 4 }}>
              Settings
            </h1>
            <p style={{ fontSize: 13, color: "var(--text-3)", fontWeight: 300 }}>
              Manage your profile, skills and preferences
            </p>
          </div>
        </div>

        <div className="page-body">

          {/* Profile hero — full width, aligns with page header */}
          {profile && (
            <div className="settings-profile-card" style={{ marginBottom: 24 }}>
              <div className="settings-avatar-lg">
                {(profile.display_name || "U").charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="settings-profile-name">{profile.display_name || "Your Profile"}</p>
                <p className="settings-profile-email">{profile.bio || "No bio yet"}</p>
                <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                  <span className="settings-profile-badge"><Shield size={9} /> {profile.experience || "mid"}</span>
                  {profile.hourly_rate > 0 && <span className="settings-profile-badge">${profile.hourly_rate}/hr</span>}
                  {profile.skills.length > 0 && <span className="settings-profile-badge">{profile.skills.length} skill{profile.skills.length !== 1 ? "s" : ""}</span>}
                </div>
              </div>
            </div>
          )}

          {/* Two-column grid — left: profile + rate, right: skills + password */}
          <div className="col-2" style={{ alignItems: "flex-start", gap: 18 }}>

            {/* LEFT column */}
            <form onSubmit={handleSave}>
              <div className="stack">
                <section className="card card-p stack">
                  <div className="stg-sec-hd">
                    <div className="stg-sec-ico"><UserCircle size={16} color="var(--gold)" /></div>
                    <div>
                      <p className="stg-sec-title">Profile</p>
                      <p className="stg-sec-sub">Your public identity on Sift</p>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="input-label">Display name</label>
                    <input type="text" value={displayName} onChange={e => setDN(e.target.value)}
                      placeholder="Your name" className="input" />
                  </div>
                  <div className="form-group">
                    <label className="input-label">Short bio</label>
                    <textarea value={bio} onChange={e => setBio(e.target.value)}
                      placeholder="e.g. Full-stack dev specializing in SaaS products..."
                      rows={3} className="input" style={{ resize: "vertical" }} />
                  </div>
                  <div className="form-group">
                    <label className="input-label">GitHub</label>
                    <div style={{ position: "relative" }}>
                      <Link2 size={13} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)", pointerEvents: "none" }} />
                      <input type="url" value={github} onChange={e => setGithub(e.target.value)}
                        placeholder="https://github.com/yourname" className="input" style={{ paddingLeft: 34 }} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="input-label">
                      Other portfolio
                      <span style={{ fontWeight: 300, textTransform: "none", letterSpacing: 0, color: "var(--text-3)", marginLeft: 6 }}>Behance, Dribbble, personal site…</span>
                    </label>
                    <div style={{ position: "relative" }}>
                      <Globe size={13} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)", pointerEvents: "none" }} />
                      <input type="url" value={portfolio} onChange={e => setPortfolio(e.target.value)}
                        placeholder="https://behance.net/yourname" className="input" style={{ paddingLeft: 34 }} />
                    </div>
                  </div>
                </section>

                <section className="card card-p">
                  <div className="stg-sec-hd" style={{ marginBottom: 16 }}>
                    <div className="stg-sec-ico"><DollarSign size={16} color="var(--gold)" /></div>
                    <div>
                      <p className="stg-sec-title">Rate & experience</p>
                      <p className="stg-sec-sub">Benchmarks you against market rates</p>
                    </div>
                  </div>
                  <div className="form-group" style={{ marginBottom: 14 }}>
                    <label className="input-label">Hourly rate (USD)</label>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "var(--text-3)", fontWeight: 500 }}>$</span>
                      <input type="number" value={rate} onChange={e => setRate(e.target.value)}
                        placeholder="45" min="1" max="999" className="input" style={{ paddingLeft: 24 }} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="input-label">Experience level</label>
                    <div style={{ display: "flex", gap: 6 }}>
                      {([
                        { value: "junior", label: "Junior", sub: "0–2 yrs" },
                        { value: "mid",    label: "Mid",    sub: "2–5 yrs" },
                        { value: "senior", label: "Senior", sub: "5+ yrs"  },
                      ] as const).map(o => (
                        <button key={o.value} type="button" onClick={() => setExp(o.value)}
                          style={{ flex: 1, padding: "9px 8px", border: `1px solid ${exp === o.value ? "var(--gold-border)" : "var(--border)"}`, borderRadius: "var(--radius)", background: exp === o.value ? "var(--gold-muted)" : "var(--bg-soft)", cursor: "pointer", transition: "all 0.15s", textAlign: "center" }}>
                          <p style={{ fontSize: 12, fontWeight: 600, color: exp === o.value ? "var(--gold)" : "var(--text-2)", marginBottom: 1 }}>{o.label}</p>
                          <p style={{ fontSize: 10, color: "var(--text-3)", fontWeight: 300 }}>{o.sub}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </section>

                {error && (
                  <div style={{ padding: "9px 12px", background: "var(--danger-bg)", border: "1px solid var(--danger-border)", borderRadius: "var(--radius)", fontSize: 12, color: "var(--danger)" }}>
                    {error}
                  </div>
                )}

                <button type="submit" disabled={saving} className="btn btn-primary" style={{ alignSelf: "flex-start", minWidth: 160, padding: "12px 24px", display: "flex", alignItems: "center", gap: 8 }}>
                  {saving ? <><Loader2 size={14} style={{ animation: "spin 0.7s linear infinite" }} /> Saving...</>
                    : saved ? <><CheckCircle size={14} /> Saved</>
                    : "Save changes"}
                </button>
              </div>
            </form>

            {/* RIGHT column */}
            <div className="stack">
              <section className="card card-p stack">
                <div className="stg-sec-hd">
                  <div className="stg-sec-ico"><Code2 size={16} color="var(--gold)" /></div>
                  <div>
                    <p className="stg-sec-title">Skills</p>
                    <p className="stg-sec-sub">Up to 15 skills for matching opportunities</p>
                  </div>
                </div>
                <SkillInput skills={skills} onChange={setSkills} max={15} />
              </section>

              <form onSubmit={handlePasswordChange}>
                <section className="card card-p stack">
                  <div className="stg-sec-hd">
                    <div className="stg-sec-ico"><Lock size={16} color="var(--gold)" /></div>
                    <div>
                      <p className="stg-sec-title">Change password</p>
                      <p className="stg-sec-sub">Update your login credentials</p>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="input-label">New password</label>
                    <div style={{ position: "relative" }}>
                      <input type={showNew ? "text" : "password"} value={newPwd} onChange={e => setNewPwd(e.target.value)}
                        placeholder="At least 8 characters" className="input" style={{ paddingRight: 40 }} />
                      <button type="button" onClick={() => setShowNew(v => !v)}
                        style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: 0, display: "flex" }}>
                        {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    <PasswordStrength password={newPwd} />
                  </div>
                  <div className="form-group">
                    <label className="input-label">Confirm new password</label>
                    <div style={{ position: "relative" }}>
                      <input type={showCfm ? "text" : "password"} value={cfmPwd} onChange={e => setCfmPwd(e.target.value)}
                        placeholder="Repeat your new password" className="input"
                        style={{ paddingRight: 40, borderColor: cfmPwd && newPwd !== cfmPwd ? "var(--danger)" : undefined }} />
                      <button type="button" onClick={() => setShowCfm(v => !v)}
                        style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: 0, display: "flex" }}>
                        {showCfm ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {cfmPwd && newPwd !== cfmPwd && (
                      <p style={{ fontSize: 11, color: "var(--danger)", marginTop: 4 }}>Passwords do not match</p>
                    )}
                  </div>
                  {pwdError && (
                    <div style={{ padding: "9px 12px", background: "var(--danger-bg)", border: "1px solid var(--danger-border)", borderRadius: "var(--radius)", fontSize: 12, color: "var(--danger)" }}>
                      {pwdError}
                    </div>
                  )}
                  <button type="submit" disabled={pwdSaving || !newPwd} className="btn btn-primary" style={{ alignSelf: "flex-start", minWidth: 180, padding: "12px 24px", display: "flex", alignItems: "center", gap: 8 }}>
                    {pwdSaving ? <><Loader2 size={14} style={{ animation: "spin 0.7s linear infinite" }} /> Updating...</>
                      : pwdSaved ? <><CheckCircle size={14} /> Password updated</>
                      : "Update password"}
                  </button>
                </section>
              </form>
            </div>

          </div>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
