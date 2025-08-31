"use client";

import { useEffect, useState } from "react";
import { LockPlan, LOCK_MULTIPLIERS, getPlanLabel } from "@/lib/config";
import { cn } from "@/lib/ui";

type Props = {
  open: boolean;
  plan: LockPlan | null;
  onClose: () => void;
  onStake: (amount: number) => void;
};

export default function StakeModal({ open, plan, onClose, onStake }: Props) {
  const [amount, setAmount] = useState<string>("");

  useEffect(() => {
    if (open) setAmount("");
  }, [open]);

  if (!open || !plan) return null;

  const parsed = parseFloat(amount);
  const disabled = !parsed || parsed <= 0;
  const multiplier = LOCK_MULTIPLIERS[plan];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className={cn(
        "relative z-10 w-[92%] sm:w-[420px] rounded-2xl p-5",
        "bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))]",
        "border border-white/10 shadow-2xl backdrop-blur"
      )}>
        <div className="text-lg font-semibold">Stake SOL</div>
        <div className="mt-1 text-sm text-white/70">{getPlanLabel(plan)} • {multiplier.toFixed(2)}×</div>

        <div className="mt-4 space-y-2">
          <label className="text-sm text-white/70">Amount (SOL)</label>
          <input
            type="number"
            min={0}
            step={0.0001}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-xl bg-black/30 border border-white/[0.12] px-3 py-2 outline-none"
            placeholder="Enter amount"
          />
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-white/15 text-sm">Cancel</button>
          <button
            disabled={disabled}
            onClick={() => !disabled && onStake(parsed)}
            className="px-4 py-2 rounded-xl bg-white text-black text-sm font-medium disabled:opacity-50"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}


