"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";
import { DerivedPosition } from "@/types";
import { getMaturityTs, getPlanSeconds } from "@/lib/rewards";
import { getPlanLabel } from "@/lib/config";
import { useStakingSettings } from "@/hooks/useStakingSettings";

export default function Dashboard({ wallet, refreshKey = 0 }: { wallet: string | null; refreshKey?: number }) {
  const [items, setItems] = useState<DerivedPosition[] | null>(null);
  const [now, setNow] = useState<number>(Math.floor(Date.now() / 1000));
  const settings = useStakingSettings();

  useEffect(() => {
    const t = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!wallet) { setItems(null); return; }
    apiGet<{ items: DerivedPosition[] }>(`/api/positions?wallet=${wallet}`)
      .then(r => setItems(r.items))
      .catch(() => setItems([]));
  }, [wallet, refreshKey]);

  if (!wallet) return (
    <div className="portfolio-empty">
      <div>
        <span className="portfolio-status">NO WALLET CONNECTED</span>
        <h3>Your staking positions will appear here.</h3>
        <p>Connect Phantom from the header to view active stakes, accrued rewards, and maturity dates.</p>
      </div>
      <a href="#stake">Go to staking</a>
    </div>
  );
  if (!items) return <div className="animate-pulse text-white/40">Loading positions…</div>;

  const fmt = (s: number) => s.toLocaleString();

  return (
    <div className="space-y-3">
      {items.length === 0 && (
        <div className="portfolio-empty">
          <div>
            <span className="portfolio-status">PORTFOLIO READY</span>
            <h3>No active positions yet.</h3>
            <p>Choose a staking plan to create your first CREX reward position.</p>
          </div>
          <a href="#plans">Choose a plan</a>
        </div>
      )}
      {items.map(p => {
        const remain = Math.max(0, getMaturityTs(p.start_ts, p.lock_plan) - now);
        const totalSeconds = getPlanSeconds(p.lock_plan);
        const elapsed = Math.max(0, totalSeconds - remain);
        const percent = Math.min(100, Math.max(0, Math.floor((elapsed / totalSeconds) * 100)));
        const dd = Math.floor(remain / 86400);
        const hh = Math.floor((remain % 86400) / 3600);
        const mm = Math.floor((remain % 3600) / 60);
        const claimDisabled = !p.claimable;
        const dailyCrex = Math.floor(p.amount_sol * settings.baseRate * p.lock_multiplier);

        return (
          <div key={p.id} className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-4 card-neo">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-white/70">{getPlanLabel(p.lock_plan as any)}</span>
                <span className="text-xs rounded-full px-2 py-0.5 bg-white/[0.08]">{p.lock_multiplier.toFixed(2)}×</span>
              </div>
              <div className="text-xs text-white/60">{claimDisabled ? `Matures in ${dd}d ${hh}h ${mm}m` : "Ready to claim"}</div>
            </div>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl bg-white/[0.04] border border-white/[0.08] p-3">
                <div className="text-xs text-white/60">Amount</div>
                <div className="text-lg font-semibold">{p.amount_sol} SOL</div>
              </div>
              <div className="rounded-xl bg-white/[0.04] border border-white/[0.08] p-3">
                <div className="text-xs text-white/60">Accrued</div>
                <div className="text-lg font-semibold">{fmt(Math.floor(p.accrued_pboxc))} CREX</div>
                <div className="text-[11px] text-white/50 mt-1">Daily ~ {fmt(dailyCrex)} CREX</div>
              </div>
              <div className="flex items-center justify-end">
                <button
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-white text-black disabled:opacity-50 h-[42px]"
                  disabled={claimDisabled}
                  onClick={async () => {
                    const r = await apiPost<{ position: DerivedPosition; claimed: number }>("/api/claim", { id: p.id, wallet_address: wallet! }).catch(() => null);
                    if (r) {
                      setItems(items.map(x => (x.id === p.id ? { ...x, status: "claimed", claimed_pboxc: r.claimed } : x)));
                    }
                  }}
                >
                  Claim
                </button>
              </div>
            </div>

            <div className="mt-3">
              <div className="h-2 w-full rounded-full bg-white/[0.06] overflow-hidden">
                <div className="h-full bg-white/70" style={{ width: `${percent}%` }} />
              </div>
              <div className="flex justify-between text-[11px] text-white/50 mt-1">
                <span>{Math.floor(elapsed / 86400)} days elapsed</span>
                <span>{percent}%</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
