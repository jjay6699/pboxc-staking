"use client";

import { useMemo, useState } from "react";
import { LOCK_DURATIONS_SECS, LockPlan, getPlanLabel } from "@/lib/config";
import { useStakingSettings } from "@/hooks/useStakingSettings";

export default function Calculator() {
  const [amount, setAmount] = useState<number>(1);
  const [plan, setPlan] = useState<LockPlan>("1m");
  const settings = useStakingSettings();

  const multiplier = settings.multipliers[plan];
  const days = Math.floor(LOCK_DURATIONS_SECS[plan] / 86400);
  const daily = useMemo(
    () => Math.max(0, amount) * settings.baseRate * multiplier,
    [amount, settings.baseRate, multiplier],
  );
  const total = useMemo(() => daily * days, [daily, days]);

  return (
    <div className="calculator-panel">
      <div className="calculator-inputs">
        <div className="calculator-field">
          <label htmlFor="calculator-amount">Amount to stake</label>
          <span className="field-suffix">SOL</span>
          <input
            id="calculator-amount"
            type="number"
            min={0}
            step={0.0001}
            value={amount}
            onChange={(event) => setAmount(parseFloat(event.target.value) || 0)}
            className="calculator-control"
          />
        </div>
        <div className="calculator-field">
          <label htmlFor="calculator-plan">Lock period</label>
          <select
            id="calculator-plan"
            value={plan}
            onChange={(event) => setPlan(event.target.value as LockPlan)}
            className="calculator-control select-neo"
          >
            {(Object.keys(settings.multipliers) as LockPlan[]).map((item) => (
              <option key={item} value={item}>{getPlanLabel(item)}</option>
            ))}
          </select>
        </div>
        <div className="calculator-field">
          <label>Reward multiplier</label>
          <div className="calculator-control calculator-readonly">{multiplier.toFixed(2)}×</div>
        </div>
      </div>

      <div className="calculator-results">
        <div>
          <span>Daily reward</span>
          <strong>{Math.floor(daily).toLocaleString()} <small>PBOXC</small></strong>
        </div>
        <div>
          <span>Lock duration</span>
          <strong>{days} <small>days</small></strong>
        </div>
        <div className="calculator-total">
          <span>Projected total</span>
          <strong>{Math.floor(total).toLocaleString()} <small>PBOXC</small></strong>
        </div>
      </div>
    </div>
  );
}
