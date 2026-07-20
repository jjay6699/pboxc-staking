"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, LockKeyhole, ShieldCheck, X } from "lucide-react";
import {
  CONTRACT_ADDRESS,
  LOCK_DURATIONS_SECS,
  LockPlan,
  getPlanLabel,
} from "@/lib/config";
import { useStakingSettings } from "@/hooks/useStakingSettings";

type Props = {
  open: boolean;
  plan: LockPlan | null;
  initialAmount?: number;
  onClose: () => void;
  onStake: (amount: number) => void | Promise<void>;
};

export default function StakeModal({ open, plan, initialAmount, onClose, onStake }: Props) {
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const settings = useStakingSettings();

  useEffect(() => {
    if (open) {
      setAmount(initialAmount ? String(initialAmount) : "");
      setSubmitting(false);
    }
  }, [open, initialAmount]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, submitting]);

  const parsed = Number(amount);
  const validAmount =
    Number.isFinite(parsed) &&
    parsed >= settings.minDepositSol &&
    parsed <= settings.maxDepositSol;
  const multiplier = plan ? settings.multipliers[plan] : 0;
  const days = plan ? Math.floor(LOCK_DURATIONS_SECS[plan] / 86400) : 0;
  const dailyReward = validAmount ? parsed * settings.baseRate * multiplier : 0;
  const totalReward = useMemo(
    () => dailyReward * days,
    [dailyReward, days],
  );

  if (!open || !plan) return null;

  const submit = async () => {
    if (!validAmount || submitting) return;
    setSubmitting(true);
    try {
      await onStake(parsed);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="stake-modal-root" role="dialog" aria-modal="true" aria-labelledby="stake-modal-title">
      <button className="stake-modal-backdrop" aria-label="Close staking dialog" onClick={onClose} />
      <div className="stake-modal">
        <div className="stake-modal-header">
          <div>
            <p>REVIEW POSITION</p>
            <h2 id="stake-modal-title">Stake SOL</h2>
          </div>
          <button type="button" className="stake-modal-close" onClick={onClose} disabled={submitting} aria-label="Close">
            <X size={19} />
          </button>
        </div>

        <div className="stake-modal-plan">
          <div className="stake-modal-plan-icon"><LockKeyhole size={18} /></div>
          <div>
            <span>Selected lock plan</span>
            <strong>{getPlanLabel(plan)}</strong>
          </div>
          <div className="stake-modal-multiplier">
            <span>Multiplier</span>
            <strong>{multiplier.toFixed(2)}×</strong>
          </div>
        </div>

        <div className="stake-modal-field">
          <div className="stake-modal-label">
            <label htmlFor="stake-modal-amount">Amount to stake</label>
            <span>SOL</span>
          </div>
          <input
            id="stake-modal-amount"
            type="number"
            min="0"
            step="0.0001"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="0.00"
            autoFocus
          />
          <p className="stake-modal-limit">
            Allowed range: {settings.minDepositSol}–{settings.maxDepositSol} SOL
          </p>
        </div>

        <div className="stake-modal-summary">
          <div>
            <span>Daily reward</span>
            <strong>{Math.floor(dailyReward).toLocaleString()} CREX</strong>
          </div>
          <div>
            <span>Lock duration</span>
            <strong>{days} days</strong>
          </div>
          <div>
            <span>Projected total</span>
            <strong>{Math.floor(totalReward).toLocaleString()} CREX</strong>
          </div>
        </div>

        <div className="stake-modal-destination">
          <ShieldCheck size={17} />
          <div>
            <span>Verified destination</span>
            <code>{CONTRACT_ADDRESS.slice(0, 8)}…{CONTRACT_ADDRESS.slice(-8)}</code>
          </div>
        </div>

        <button
          type="button"
          className="stake-modal-submit"
          disabled={!validAmount || submitting || settings.stakingPaused}
          onClick={submit}
        >
          {settings.stakingPaused
            ? "Staking temporarily paused"
            : submitting
              ? "Waiting for Phantom…"
              : "Continue in Phantom"}
          {!submitting && <ArrowRight size={18} />}
        </button>

        <p className="stake-modal-note">
          Phantom will show the final recipient, amount, and network before you approve the transaction.
        </p>
      </div>
    </div>
  );
}
