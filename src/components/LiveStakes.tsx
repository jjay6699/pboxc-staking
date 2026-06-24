"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, Radio } from "lucide-react";
import { apiGet } from "@/lib/api";

type LiveStake = {
  id: string;
  wallet: string;
  amountSol: number;
  plan: string;
  multiplier: number;
  startedAt: number;
  maturityAt: number;
  status: "active" | "matured" | "claimed";
};

type LiveStakeResponse = {
  items: LiveStake[];
  updatedAt: number;
};

function relativeTime(timestamp: number) {
  const seconds = Math.max(0, Math.floor(Date.now() / 1000) - timestamp);
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(timestamp * 1000).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function LiveStakes() {
  const [items, setItems] = useState<LiveStake[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = () => {
      apiGet<LiveStakeResponse>("/api/live-stakes?limit=12")
        .then((response) => {
          if (!cancelled) setItems(response.items);
        })
        .catch(() => {
          if (!cancelled) setItems([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    };

    load();
    const timer = window.setInterval(load, 15000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  return (
    <section id="live-stakes" className="live-stakes-section">
      <div className="live-stakes-heading">
        <div>
          <p className="section-kicker">NETWORK ACTIVITY</p>
          <h2>Live stakes</h2>
        </div>
        <div className="live-status">
          <span><Radio size={13} /> Live</span>
          <p>Verified staking positions recorded by the platform.</p>
        </div>
      </div>

      <div className="live-stakes-table">
        <div className="live-table-head">
          <span>Wallet</span>
          <span>Amount</span>
          <span>Lock plan</span>
          <span>Multiplier</span>
          <span>Started</span>
          <span>Status</span>
        </div>

        {loading ? (
          <div className="live-empty">Loading verified stakes…</div>
        ) : items.length === 0 ? (
          <div className="live-empty">
            <strong>No verified stakes yet.</strong>
            <span>The first completed deposit will appear here automatically.</span>
          </div>
        ) : (
          items.map((item) => (
            <div className="live-stake-row" key={item.id}>
              <span className="live-wallet">{item.wallet}</span>
              <strong>{item.amountSol.toLocaleString()} <small>SOL</small></strong>
              <span>{item.plan}</span>
              <span>{item.multiplier.toFixed(2)}×</span>
              <span>{relativeTime(item.startedAt)}</span>
              <span className={`stake-status stake-status-${item.status}`}>
                {item.status}
              </span>
            </div>
          ))
        )}
      </div>

      <div className="live-stakes-note">
        <span>Wallet identifiers are shortened for readability.</span>
        <a href="#plans">Start staking <ArrowUpRight size={14} /></a>
      </div>
    </section>
  );
}
