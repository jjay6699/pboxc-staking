"use client";

import { FormEvent, useEffect, useState } from "react";
import { LockKeyhole, LogOut, Save, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { DEFAULT_STAKING_SETTINGS, StakingSettings } from "@/lib/stakingSettings";

type Stats = {
  tvl: number;
  totalStakers: number;
  totalDistributed: number;
};

export default function AdminPage() {
  const [checking, setChecking] = useState(true);
  const [configured, setConfigured] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [settings, setSettings] = useState<StakingSettings>(DEFAULT_STAKING_SETTINGS);
  const [stats, setStats] = useState<Stats | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/session", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        setConfigured(data.configured);
        setAuthenticated(data.authenticated);
        if (data.authenticated) return loadSettings();
      })
      .finally(() => setChecking(false));
  }, []);

  const loadSettings = async () => {
    const response = await fetch("/api/admin/settings", { cache: "no-store" });
    if (!response.ok) {
      if (response.status === 401) setAuthenticated(false);
      return;
    }
    const data = await response.json();
    setSettings(data.settings);
    setStats(data.stats);
  };

  const login = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setMessage(data.error === "admin_not_configured"
        ? "Admin environment variables are not configured."
        : "Invalid username or password.");
      return;
    }
    setPassword("");
    setAuthenticated(true);
    await loadSettings();
  };

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthenticated(false);
    setSettings(DEFAULT_STAKING_SETTINGS);
    setStats(null);
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const response = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(response.status === 401 ? "Your session expired. Please log in again." : "Could not save these settings.");
      if (response.status === 401) setAuthenticated(false);
    } else {
      setSettings(data.settings);
      setMessage("Settings saved successfully.");
    }
    setSaving(false);
  };

  const setNumber = (key: "baseRate" | "minDepositSol" | "maxDepositSol", value: string) => {
    setSettings((current) => ({ ...current, [key]: Number(value) }));
  };

  const setMultiplier = (plan: keyof StakingSettings["multipliers"], value: string) => {
    setSettings((current) => ({
      ...current,
      multipliers: { ...current.multipliers, [plan]: Number(value) },
    }));
  };

  if (checking) {
    return <main className="admin-shell"><div className="admin-loading">Checking secure session…</div></main>;
  }

  if (!authenticated) {
    return (
      <main className="admin-shell">
        <div className="admin-login">
          <div className="admin-login-mark"><LockKeyhole size={24} /></div>
          <p className="section-kicker">PERABOX CONTROL</p>
          <h1>Admin login</h1>
          <p>Manage staking limits, reward rates, multipliers, and platform availability.</p>
          {!configured && (
            <div className="admin-warning">
              Add ADMIN_USERNAME, ADMIN_PASSWORD, and ADMIN_SESSION_SECRET in Vercel before signing in.
            </div>
          )}
          <form onSubmit={login}>
            <label>
              Username
              <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" />
            </label>
            <label>
              Password
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" />
            </label>
            {message && <div className="admin-form-message admin-form-error">{message}</div>}
            <button type="submit" disabled={!configured}>Sign in securely</button>
          </form>
          <Link href="/">Return to staking site</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <div className="admin-dashboard">
        <header className="admin-header">
          <div>
            <p className="section-kicker">PERABOX CONTROL</p>
            <h1>Staking administration</h1>
            <p>Changes are saved to the connected platform database and enforced by the API.</p>
          </div>
          <button type="button" onClick={logout}><LogOut size={16} /> Sign out</button>
        </header>

        {stats && (
          <section className="admin-stats">
            <div><span>Total value locked</span><strong>{stats.tvl.toLocaleString()} SOL</strong></div>
            <div><span>Total stakers</span><strong>{stats.totalStakers.toLocaleString()}</strong></div>
            <div><span>PBOXC distributed</span><strong>{stats.totalDistributed.toLocaleString()}</strong></div>
          </section>
        )}

        <form onSubmit={save} className="admin-settings">
          <section className="admin-card">
            <div className="admin-card-heading">
              <div>
                <h2>Platform controls</h2>
                <p>Set deposit boundaries and temporarily stop new stakes when required.</p>
              </div>
              <ShieldCheck size={21} />
            </div>
            <div className="admin-grid-three">
              <label>Minimum deposit (SOL)<input type="number" min="0.000001" step="0.000001" value={settings.minDepositSol} onChange={(event) => setNumber("minDepositSol", event.target.value)} /></label>
              <label>Maximum deposit (SOL)<input type="number" min="0.000001" step="0.000001" value={settings.maxDepositSol} onChange={(event) => setNumber("maxDepositSol", event.target.value)} /></label>
              <label>Base PBOXC / SOL / day<input type="number" min="0.000001" step="0.01" value={settings.baseRate} onChange={(event) => setNumber("baseRate", event.target.value)} /></label>
            </div>
            <label className="admin-toggle">
              <input type="checkbox" checked={settings.stakingPaused} onChange={(event) => setSettings((current) => ({ ...current, stakingPaused: event.target.checked }))} />
              <span />
              <div><strong>Pause new staking</strong><small>Existing positions remain visible and claimable.</small></div>
            </label>
          </section>

          <section className="admin-card">
            <div className="admin-card-heading">
              <div>
                <h2>Reward multipliers</h2>
                <p>These values apply when new staking positions are created.</p>
              </div>
            </div>
            <div className="admin-grid-four">
              <label>1 Month<input type="number" min="0.01" max="100" step="0.01" value={settings.multipliers["1m"]} onChange={(event) => setMultiplier("1m", event.target.value)} /></label>
              <label>3 Months<input type="number" min="0.01" max="100" step="0.01" value={settings.multipliers["3m"]} onChange={(event) => setMultiplier("3m", event.target.value)} /></label>
              <label>6 Months<input type="number" min="0.01" max="100" step="0.01" value={settings.multipliers["6m"]} onChange={(event) => setMultiplier("6m", event.target.value)} /></label>
              <label>12 Months<input type="number" min="0.01" max="100" step="0.01" value={settings.multipliers["12m"]} onChange={(event) => setMultiplier("12m", event.target.value)} /></label>
            </div>
            <div className="admin-notice">
              Base-rate changes affect reward calculations platform-wide. Existing positions retain the multiplier stored when they were created.
            </div>
          </section>

          <div className="admin-savebar">
            <div>
              {message && <span className={message.includes("successfully") ? "admin-success" : "admin-form-error"}>{message}</span>}
              {settings.updatedAt > 0 && <small>Last updated {new Date(settings.updatedAt * 1000).toLocaleString()}</small>}
            </div>
            <button type="submit" disabled={saving}><Save size={16} /> {saving ? "Saving…" : "Save settings"}</button>
          </div>
        </form>
      </div>
    </main>
  );
}
