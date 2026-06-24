"use client";

import { LOCK_MULTIPLIERS, BASE_RATE, LockPlan, getPlanLabel } from "@/lib/config";
import { cn } from "@/lib/ui";

export default function PlanCards({ onSelect }: { onSelect: (plan: LockPlan) => void }) {
  const entries = Object.entries(LOCK_MULTIPLIERS) as [LockPlan, number][];

  return (
    <div className="plan-grid">
      {entries.map(([plan, multiplier], index) => (
        <button
          key={plan}
          onClick={() => onSelect(plan)}
          className={cn("plan-card", index === entries.length - 1 && "plan-card-featured")}
        >
          <div className="plan-card-top">
            <span className="plan-index">{String(index + 1).padStart(2, "0")}</span>
            {index === entries.length - 1
              ? <span className="plan-badge">Highest reward</span>
              : <span className="plan-lock">Fixed term</span>}
          </div>
          <h3>{getPlanLabel(plan)}</h3>
          <div className="plan-multiplier">{multiplier.toFixed(2)}× <span>multiplier</span></div>
          <div className="plan-divider" />
          <div className="plan-return">
            <span>Daily return per 1 SOL</span>
            <strong>{(BASE_RATE * multiplier).toFixed(0)} PBOXC</strong>
          </div>
          <div className="plan-action">Select plan <span>→</span></div>
        </button>
      ))}
    </div>
  );
}
