"use client";

import PlanCards from "@/components/PlanCards";
import StakeModal from "@/components/StakeModal";
import Dashboard from "@/components/Dashboard";
import GlobalStats from "@/components/GlobalStats";
import StickySummary from "@/components/StickySummary";
import Calculator from "@/components/Calculator";
import Steps from "@/components/Steps";
import SectionIntro from "@/components/SectionIntro";
import Hero from "@/components/Hero";
import LiveStakes from "@/components/LiveStakes";
import { usePhantom } from "@/hooks/usePhantom";
import { LockPlan, CONTRACT_ADDRESS, DEFAULT_CLUSTER } from "@/lib/config";
import { sendSolViaPhantom } from "@/lib/phantom";
import { apiPost } from "@/lib/api";
import { useState } from "react";

export default function Home() {
  const { address, provider, connect, cluster } = usePhantom();
  const [selectedPlan, setSelectedPlan] = useState<LockPlan | null>(null);
  const [initialAmount, setInitialAmount] = useState<number | undefined>();
  const [open, setOpen] = useState(false);
  const [positionsVersion, setPositionsVersion] = useState(0);

  const handleStake = async (amount: number, plan: LockPlan) => {
    try {
      const amt = Number(amount);
      if (!amt || amt <= 0) {
        alert("Please enter a valid SOL amount.");
        return;
      }
      if (!plan) {
        alert("Please select a lock plan.");
        return;
      }
      if (!provider) {
        await connect?.();
      }
      const p = (provider ?? (window as any).solana);
      if (!p) {
        alert("Phantom is not available.");
        return;
      }
      const activeCluster = cluster ?? DEFAULT_CLUSTER;
      const signature = await sendSolViaPhantom({ provider: p, recipient: CONTRACT_ADDRESS, amountSol: amt, cluster: activeCluster });
      const walletAddress = address ?? p.publicKey?.toString?.();
      if (walletAddress) {
        try {
          await apiPost("/api/positions", {
            wallet_address: walletAddress,
            amount_sol: amt,
            lock_plan: plan,
            tx_signature: signature,
            cluster: activeCluster,
          });
          setPositionsVersion(v => v + 1);
        } catch (err) {
          console.error("Failed to store position locally", err);
        }
      }
      setOpen(false);
    } catch (e: any) {
      if (/User rejected/i.test(e?.message)) return; // silent cancel
      console.error("Stake error", e);
      alert(e?.message || "Failed to open Phantom");
    }
  };

  return (
    <div>
      <section>
        <Hero onContinue={(plan, amount) => {
          setSelectedPlan(plan);
          setInitialAmount(amount);
          setOpen(true);
        }} />
        <Steps />
      </section>

      <section id="calculator" className="content-section">
        <SectionIntro title="Estimate your rewards" subtitle="Adjust the amount and lock period to compare the projected daily and total return." />
        <Calculator />
      </section>

      <section id="plans" className="content-section">
        <SectionIntro title="Choose a lock plan" subtitle="Longer commitments earn a higher reward multiplier. All positions remain locked until maturity." />
        <PlanCards onSelect={(p) => {
          setSelectedPlan(p);
          setInitialAmount(undefined);
          setOpen(true);
        }} />
      </section>

      <StakeModal
        open={open}
        plan={selectedPlan}
        initialAmount={initialAmount}
        onClose={() => setOpen(false)}
        onStake={(amt: number) => {
          if (selectedPlan) return handleStake(amt, selectedPlan);
        }}
      />

      <section id="dashboard" className="content-section">
        <SectionIntro title="Your staking portfolio" subtitle="Monitor active positions, accrued PBOXC, and upcoming maturity dates in one place." />
        <Dashboard wallet={address} refreshKey={positionsVersion} />
      </section>

      <LiveStakes />

      <section id="stats" className="stats-section">
        <GlobalStats refreshKey={positionsVersion} />
      </section>

      <StickySummary address={address} />
    </div>
  );
}
