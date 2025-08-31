"use client";

import { LOCK_MULTIPLIERS, BASE_RATE, LockPlan, getPlanLabel } from "@/lib/config";
import { cn } from "@/lib/ui";

export default function PlanCards({ onSelect }: { onSelect: (plan: LockPlan) => void }) {
  const entries = Object.entries(LOCK_MULTIPLIERS) as [LockPlan, number][];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {entries.map(([plan, mult]) => {
        const daily = 1 * BASE_RATE * mult; // 1 SOL baseline
        return (
          <button key={plan} onClick={() => onSelect(plan)} className={cn(
            "rounded-2xl text-left p-5 bg-white/[0.03] border border-white/[0.08] transition duration-200 card-neo",
            "shadow-sm"
          )}>
            <div className="flex items-center justify-between">
              <div className="text-base font-semibold">{getPlanLabel(plan)}</div>
              <div className="text-xs px-2 py-0.5 rounded-full bg-white/[0.08]">Locked • No early claim</div>
            </div>
            <div className="mt-2 text-sm text-white/70">Multiplier</div>
            <div className="text-lg font-medium">{mult.toFixed(2)}×</div>
            <div className="mt-3 text-sm text-white/70">Est. daily per 1 SOL</div>
            <div className="text-lg font-medium">{daily.toFixed(0)} PBOXC</div>
          </button>
        );
      })}
    </div>
  );
}
