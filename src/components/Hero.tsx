"use client";

import { ArrowDown, ArrowRight, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import {
  BASE_RATE,
  LOCK_DURATIONS_SECS,
  LOCK_MULTIPLIERS,
  LockPlan,
  getPlanLabel,
} from "@/lib/config";
import { usePhantom } from "@/hooks/usePhantom";

type Props = {
  onContinue: (plan: LockPlan, amount: number) => void;
};

export default function Hero({ onContinue }: Props) {
  const [amount, setAmount] = useState("1");
  const [plan, setPlan] = useState<LockPlan>("3m");
  const { provider, address, connecting, connect, networkLabel, balanceSol } = usePhantom();

  const numericAmount = Math.max(0, Number(amount) || 0);
  const multiplier = LOCK_MULTIPLIERS[plan];
  const days = Math.floor(LOCK_DURATIONS_SECS[plan] / 86400);
  const total = useMemo(
    () => numericAmount * BASE_RATE * multiplier * days,
    [numericAmount, multiplier, days],
  );

  const primaryLabel = address
    ? "Review stake"
    : connecting
      ? "Connecting…"
      : provider
        ? "Connect wallet to continue"
        : "Install Phantom to continue";

  const onPrimary = async () => {
    if (!address) {
      await connect();
      return;
    }
    if (numericAmount > 0) onContinue(plan, numericAmount);
  };

  return (
    <section id="stake" className="hero-shell">
      <div className="hero-copy">
        <div className="eyebrow">PBOXC STAKING ON SOLANA</div>
        <h1 className="hero-title">
          Put your SOL to work.
          <span>Earn PBOXC daily.</span>
        </h1>
        <p className="hero-description">
          Choose a fixed staking period and earn a predictable daily reward.
          Longer commitments receive a higher multiplier.
        </p>

        <div className="hero-actions">
          <a href="#plans" className="hero-primary-link">
            Explore plans <ArrowRight size={17} />
          </a>
          <a href="#live-stakes" className="hero-secondary-link">
            Live Stakes <ArrowDown size={16} />
          </a>
        </div>

        <div className="hero-assurances">
          <div>
            <ShieldCheck size={17} />
            <span>Phantom secured</span>
          </div>
          <span className="assurance-divider" />
          <div>
            <span className="network-dot" />
            <span>Solana {networkLabel}</span>
          </div>
          <span className="assurance-divider" />
          <div>
            <span className="assurance-value">100</span>
            <span>PBOXC / SOL / day</span>
          </div>
        </div>
      </div>

      <div className="stake-card">
        <div className="stake-card-header">
          <div>
            <p className="stake-card-kicker">NEW POSITION</p>
            <h2>Stake SOL</h2>
          </div>
          <div className="stake-rate">
            <span>Base rate</span>
            <strong>{BASE_RATE} PBOXC/day</strong>
          </div>
        </div>

        <div className="stake-field">
          <div className="stake-field-label">
            <label htmlFor="hero-amount">Amount</label>
            <span>SOL</span>
          </div>
          <div className="amount-input-wrap">
            <input
              id="hero-amount"
              type="number"
              min="0"
              step="0.0001"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              aria-label="Amount in SOL"
            />
            <button
              type="button"
              onClick={() => balanceSol != null && setAmount(String(balanceSol))}
              disabled={balanceSol == null}
            >
              MAX
            </button>
          </div>
        </div>

        <fieldset className="stake-field">
          <div className="stake-field-label">
            <legend>Lock period</legend>
            <span>{multiplier.toFixed(2)}× multiplier</span>
          </div>
          <div className="period-grid">
            {(Object.keys(LOCK_MULTIPLIERS) as LockPlan[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setPlan(item)}
                className={item === plan ? "is-selected" : ""}
                aria-pressed={item === plan}
              >
                {getPlanLabel(item).replace(" Months", "M").replace(" Month", "M")}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="reward-preview">
          <div>
            <span>Estimated reward</span>
            <strong>{Math.floor(total).toLocaleString()} PBOXC</strong>
          </div>
          <div>
            <span>Duration</span>
            <strong>{days} days</strong>
          </div>
          <div>
            <span>Daily reward</span>
            <strong>{Math.floor(numericAmount * BASE_RATE * multiplier).toLocaleString()} PBOXC</strong>
          </div>
        </div>

        <button
          type="button"
          onClick={onPrimary}
          disabled={connecting || numericAmount <= 0}
          className="stake-submit"
        >
          {primaryLabel}
          {!connecting && <ArrowRight size={18} />}
        </button>

        <p className="stake-disclaimer">
          Funds remain locked until the selected plan reaches maturity.
        </p>
      </div>
    </section>
  );
}
