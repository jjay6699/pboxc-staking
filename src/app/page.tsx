"use client";

import WalletPanel from "@/components/WalletPanel";
import PlanCards from "@/components/PlanCards";
import StakeModal from "@/components/StakeModal";
import Dashboard from "@/components/Dashboard";
import GlobalStats from "@/components/GlobalStats";
import StickySummary from "@/components/StickySummary";
import Calculator from "@/components/Calculator";
import Steps from "@/components/Steps";
import SectionIntro from "@/components/SectionIntro";
import { usePhantom } from "@/hooks/usePhantom";
import { LockPlan, CONTRACT_ADDRESS, DEFAULT_CLUSTER } from "@/lib/config";
import { sendSolViaPhantom } from "@/lib/phantom";
import { useState } from "react";

export default function Home() {
  const { address, provider, connect, isConnected } = usePhantom() as any;
  const [selectedPlan, setSelectedPlan] = useState<LockPlan | null>(null);
  const [open, setOpen] = useState(false);

  const handleStake = async (amount: number) => {
    try {
      const amt = Number(amount);
      if (!amt || amt <= 0) {
        alert("Please enter a valid SOL amount.");
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
      await sendSolViaPhantom({ provider: p, recipient: CONTRACT_ADDRESS, amountSol: amt, cluster: DEFAULT_CLUSTER });
      setOpen(false);
    } catch (e: any) {
      if (/User rejected/i.test(e?.message)) return; // silent cancel
      console.error("Stake error", e);
      alert(e?.message || "Failed to open Phantom");
    }
  };

  return (
    <div className="space-y-10">
      <section>
        <header className="pb-8">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">PBOXC Staking</h1>
          <p className="text-white/70 text-base mt-3 leading-relaxed">Stake SOL into time-locked plans to earn daily PBOXC rewards. Rewards accrue linearly each day at a base rate of 100 PBOXC per SOL and are boosted by the selected lock multiplier. Funds remain locked until maturity, at which point you can claim or restake.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="#plans" className="px-4 py-2 rounded-xl bg-white text-black text-sm font-medium">View Plans</a>
            <a href="#dashboard" className="px-4 py-2 rounded-xl border border-white/15 text-sm text-white/80 hover:text-white">Your Dashboard</a>
          </div>
          <div className="mt-8 border-t border-white/10" />
        </header>
        <Steps />
        <div className="mt-6" />
        <SectionIntro className="mt-6 mb-4" title="1) Connect your wallet" subtitle="Connect Phantom and review the contract address for deposits." />
        <WalletPanel />
      </section>

      <section id="calculator">
        <SectionIntro className="mt-6 mb-4" title="2) Estimate your rewards" subtitle="Use the calculator to preview daily and total PBOXC based on amount and lock plan." />
        <Calculator />
      </section>

      <section id="plans">
        <SectionIntro className="mt-6 mb-4" title="3) Choose a lock plan" subtitle="Pick a lock period. After selection, enter the SOL amount and confirm in Phantom." />
        <PlanCards onSelect={(p) => { setSelectedPlan(p); setOpen(true); }} />
      </section>

      <StakeModal
        open={open}
        plan={selectedPlan}
        onClose={() => setOpen(false)}
        onStake={(amt) => handleStake(amt)}
      />

      <section id="dashboard">
        <SectionIntro className="mt-6 mb-4" title="4) Track earnings and claim" subtitle="Your positions appear here with daily accrual, maturity countdown, and Claim/Restake actions." />
        <Dashboard wallet={address} />
      </section>

      <section id="stats">
        <GlobalStats />
      </section>

      <StickySummary address={address} />
    </div>
  );
}
