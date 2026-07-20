"use client";

import { ArrowDown, ArrowRight, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import {
  LOCK_DURATIONS_SECS,
  LockPlan,
  getPlanLabel,
} from "@/lib/config";
import { usePhantom } from "@/hooks/usePhantom";
import { useStakingSettings } from "@/hooks/useStakingSettings";

type Props = {
  onContinue: (plan: LockPlan, amount: number) => void;
};

export default function Hero({ onContinue }: Props) {
  const [amount, setAmount] = useState("1");
  const [plan, setPlan] = useState<LockPlan>("3m");
  const { provider, address, connecting, connect, balanceSol } = usePhantom();
  const settings = useStakingSettings();

  const numericAmount = Math.max(0, Number(amount) || 0);
  const multiplier = settings.multipliers[plan];
  const days = Math.floor(LOCK_DURATIONS_SECS[plan] / 86400);
  const total = useMemo(
    () => numericAmount * settings.baseRate * multiplier * days,
    [numericAmount, settings.baseRate, multiplier, days],
  );

  const primaryLabel = address
    ? "Review stake"
    : connecting
      ? "Connecting…"
      : provider
        ? "Connect wallet to continue"
        : "Connect Wallet to continue";

  const onPrimary = async () => {
    if (!address) {
      await connect();
      return;
    }
    if (
      !settings.stakingPaused &&
      numericAmount >= settings.minDepositSol &&
      numericAmount <= settings.maxDepositSol
    ) onContinue(plan, numericAmount);
  };

  return (
    <section id="stake" className="hero-shell">
      <div className="hero-copy">
        <div className="eyebrow">CREX STAKING ON CREX CHAIN</div>
        <h1 className="hero-title">
          Put your ERC-20 tokens to work.
          <span>Earn CREX daily.</span>
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
            <span>EVM wallet secured</span>
          </div>
          <span className="assurance-divider" />
          <div>
            <span className="network-dot" />
            <span>CREX Chain Testnet</span>
          </div>
          <span className="assurance-divider" />
          <div>
            <span className="assurance-value">{settings.baseRate.toLocaleString()}</span>
            <span>CREX / staked token / day</span>
          </div>
        </div>
      </div>

      <div className="stake-card">
        <div className="stake-card-header">
          <div>
            <p className="stake-card-kicker">NEW POSITION</p>
            <h2>Stake ERC-20</h2>
          </div>
          <div className="stake-rate">
            <span>Base rate</span>
            <strong>{settings.baseRate.toLocaleString()} CREX/day</strong>
          </div>
        </div>

        <div className="stake-field">
          <div className="stake-field-label">
            <label htmlFor="hero-amount">Amount</label>
            <span>TOKEN</span>
          </div>
          <div className="amount-input-wrap">
            <input
              id="hero-amount"
              type="number"
              min="0"
              step="0.0001"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              aria-label="Amount in testnet ERC-20 token"
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
            {(Object.keys(settings.multipliers) as LockPlan[]).map((item) => (
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
            <strong>{Math.floor(total).toLocaleString()} CREX</strong>
          </div>
          <div>
            <span>Duration</span>
            <strong>{days} days</strong>
          </div>
          <div>
            <span>Daily reward</span>
            <strong>{Math.floor(numericAmount * settings.baseRate * multiplier).toLocaleString()} CREX</strong>
          </div>
        </div>

        <button
          type="button"
          onClick={onPrimary}
          disabled={
            connecting ||
            settings.stakingPaused ||
            numericAmount < settings.minDepositSol ||
            numericAmount > settings.maxDepositSol
          }
          className="stake-submit"
        >
          {settings.stakingPaused ? "Staking temporarily paused" : primaryLabel}
          {!connecting && <ArrowRight size={18} />}
        </button>

        <p className="stake-disclaimer">
          {settings.stakingPaused
            ? "New positions are temporarily unavailable."
            : `Minimum ${settings.minDepositSol} token · Maximum ${settings.maxDepositSol} token`}
        </p>
      </div>
    </section>
  );
}
