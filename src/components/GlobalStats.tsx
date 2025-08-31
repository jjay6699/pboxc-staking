"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";

export default function GlobalStats() {
  const [stats, setStats] = useState<{ tvl: number; totalStakers: number; totalDistributed: number } | null>(null);
  useEffect(() => {
    apiGet<{ tvl: number; totalStakers: number; totalDistributed: number }>("/api/stats").then(setStats).catch(() => setStats({ tvl: 0, totalStakers: 0, totalDistributed: 0 }));
  }, []);
  const fmt = (n: number) => n.toLocaleString();
  return (
    <div className="grid grid-cols-3 gap-3 mt-8">
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-4">
        <div className="text-xs text-white/60">TVL (SOL)</div>
        <div className="text-lg font-medium">{stats ? fmt(stats.tvl) : "—"}</div>
      </div>
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-4">
        <div className="text-xs text-white/60">Total stakers</div>
        <div className="text-lg font-medium">{stats ? fmt(stats.totalStakers) : "—"}</div>
      </div>
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-4">
        <div className="text-xs text-white/60">Total PBOXC distributed</div>
        <div className="text-lg font-medium">{stats ? fmt(stats.totalDistributed) : "—"}</div>
      </div>
    </div>
  );
}
