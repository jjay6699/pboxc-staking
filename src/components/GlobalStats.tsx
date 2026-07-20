"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";

type Props = { refreshKey?: number };

export default function GlobalStats({ refreshKey = 0 }: Props) {
  const [stats, setStats] = useState<{ tvl: number; totalStakers: number; totalDistributed: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiGet<{ tvl: number; totalStakers: number; totalDistributed: number }>("/api/stats")
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch(() => {
        if (!cancelled) setStats({ tvl: 0, totalStakers: 0, totalDistributed: 0 });
      });
    return () => { cancelled = true; };
  }, [refreshKey]);

  const format = (value: number) => value.toLocaleString();

  return (
    <div className="stats-band">
      <div className="stats-intro">
        <span>PLATFORM ACTIVITY</span>
        <strong>Staking at a glance</strong>
      </div>
      <div className="stat-item">
        <span>Total value locked</span>
        <strong>{stats ? format(stats.tvl) : "—"} <small>SOL</small></strong>
      </div>
      <div className="stat-item">
        <span>Total stakers</span>
        <strong>{stats ? format(stats.totalStakers) : "—"}</strong>
      </div>
      <div className="stat-item">
        <span>CREX distributed</span>
        <strong>{stats ? format(stats.totalDistributed) : "—"} <small>CREX</small></strong>
      </div>
    </div>
  );
}
