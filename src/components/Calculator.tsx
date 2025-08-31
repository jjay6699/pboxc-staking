"use client";

import { useMemo, useState } from "react";
import { BASE_RATE, LOCK_DURATIONS_SECS, LOCK_MULTIPLIERS, LockPlan, getPlanLabel } from "@/lib/config";

export default function Calculator() {
  const [amount, setAmount] = useState<number>(1);
  const [plan, setPlan] = useState<LockPlan>("1m");

  const multiplier = LOCK_MULTIPLIERS[plan];
  const days = Math.floor(LOCK_DURATIONS_SECS[plan] / 86400);
  const daily = useMemo(() => Math.max(0, amount) * BASE_RATE * multiplier, [amount, multiplier]);
  const total = useMemo(() => daily * days, [daily, days]);

  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-sm text-white/70">Amount (SOL)</label>
          <input
            type="number"
            min={0}
            step={0.0001}
            value={amount}
            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            className="w-full rounded-xl bg-black/30 border border-white/[0.08] px-3 py-2 outline-none"
            placeholder="1"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-white/70">Lock Plan</label>
          <select
            value={plan}
            onChange={(e) => setPlan(e.target.value as LockPlan)}
            className="w-full rounded-xl bg-black/30 border border-white/[0.08] px-3 py-2 outline-none"
          >
            {(Object.keys(LOCK_MULTIPLIERS) as LockPlan[]).map((p) => (
              <option key={p} value={p}>{getPlanLabel(p)}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm text-white/70">Multiplier</label>
          <div className="rounded-xl bg-black/30 border border-white/[0.08] px-3 py-2">{multiplier.toFixed(2)}×</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl bg-white/[0.04] border border-white/[0.08] p-3">
          <div className="text-xs text-white/60">Daily PBOXC</div>
          <div className="text-lg font-semibold">{Math.floor(daily).toLocaleString()} PBOXC</div>
        </div>
        <div className="rounded-xl bg-white/[0.04] border border-white/[0.08] p-3">
          <div className="text-xs text-white/60">Duration</div>
          <div className="text-lg font-semibold">{days} days</div>
        </div>
        <div className="rounded-xl bg-white/[0.04] border border-white/[0.08] p-3">
          <div className="text-xs text-white/60">Total PBOXC</div>
          <div className="text-lg font-semibold">{Math.floor(total).toLocaleString()} PBOXC</div>
        </div>
      </div>
    </div>
  );
}


