import { LOCK_MULTIPLIERS, LockPlan } from "@/lib/config";
import { getAccruedPboxc, getDaysElapsed, getMaturityTs, isClaimable } from "@/lib/rewards";
import type { DerivedPosition, Position, TxRecord } from "@/types";

const positions: Position[] = [];
const txs: TxRecord[] = [];

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const db = {
  createPosition(args: {
    wallet_address: string;
    amount_sol: number;
    lock_plan: LockPlan;
    start_ts?: number;
  }): Position {
    const start_ts = args.start_ts ?? Math.floor(Date.now() / 1000);
    const maturity_ts = getMaturityTs(start_ts, args.lock_plan);
    const lock_multiplier = LOCK_MULTIPLIERS[args.lock_plan];
    const p: Position = {
      id: generateId(),
      wallet_address: args.wallet_address,
      amount_sol: args.amount_sol,
      lock_plan: args.lock_plan,
      lock_multiplier,
      start_ts,
      maturity_ts,
      status: "active",
      claimed_pboxc: 0,
    };
    positions.push(p);
    return p;
  },
  listPositionsByWallet(wallet: string): DerivedPosition[] {
    let now = Math.floor(Date.now() / 1000);
    try {
      const { getDemoNow } = require("@/app/api/demo/cron/route");
      now = getDemoNow();
    } catch {}
    return positions
      .filter(p => p.wallet_address === wallet)
      .map(p => {
        const derived: DerivedPosition = {
          ...p,
          days_elapsed: getDaysElapsed(p.start_ts, p.lock_plan, now),
          accrued_pboxc: getAccruedPboxc(p.amount_sol, p.lock_plan, p.start_ts, now),
          claimable: isClaimable(p.start_ts, p.lock_plan, now),
        };
        return derived;
      });
  },
  getPositionById(id: string): Position | null {
    return positions.find(p => p.id === id) ?? null;
  },
  markClaimed(id: string): Position | null {
    const p = positions.find(x => x.id === id);
    if (!p) return null;
    p.status = "claimed";
    return p;
  },
  addTx(tx: TxRecord) {
    txs.push(tx);
  },
  stats() {
    const tvl = positions.filter(p => p.status !== "claimed").reduce((sum, p) => sum + p.amount_sol, 0);
    const totalStakers = new Set(positions.map(p => p.wallet_address)).size;
    const totalDistributed = positions.filter(p => p.status === "claimed").reduce((sum, p) => sum + p.claimed_pboxc, 0);
    return { tvl, totalStakers, totalDistributed };
  }
}; 