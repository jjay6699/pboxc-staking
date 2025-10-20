import fs from "fs";
import path from "path";
import { LOCK_MULTIPLIERS, LockPlan } from "@/lib/config";
import { getAccruedPboxc, getDaysElapsed, getMaturityTs, isClaimable } from "@/lib/rewards";
import type { DerivedPosition, Position, TxRecord } from "@/types";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "storage.json");

type DbState = {
  positions: Position[];
  txs: TxRecord[];
};

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function normalizePosition(raw: any): Position | null {
  if (!raw) return null;
  const wallet = typeof raw.wallet_address === "string" ? raw.wallet_address : String(raw.wallet_address ?? "");
  if (!wallet) return null;
  const lock_plan = (raw.lock_plan ?? "1w") as LockPlan;
  const start_ts = Number(raw.start_ts ?? Math.floor(Date.now() / 1000));
  const maturity_ts = Number(raw.maturity_ts ?? getMaturityTs(start_ts, lock_plan));
  const lock_multiplier =
    typeof raw.lock_multiplier === "number" ? raw.lock_multiplier : LOCK_MULTIPLIERS[lock_plan] ?? 1;
  const status: Position["status"] =
    raw.status === "claimed" || raw.status === "matured" ? raw.status : "active";
  return {
    id: typeof raw.id === "string" ? raw.id : generateId(),
    wallet_address: wallet,
    amount_sol: Number(raw.amount_sol ?? 0),
    lock_plan,
    lock_multiplier,
    start_ts,
    maturity_ts,
    status,
    claimed_pboxc: Number(raw.claimed_pboxc ?? 0),
    tx_signature: raw.tx_signature ? String(raw.tx_signature) : raw.tx_sig ? String(raw.tx_sig) : null,
  };
}

function normalizeTx(raw: any): TxRecord | null {
  if (!raw) return null;
  const wallet = typeof raw.wallet_address === "string" ? raw.wallet_address : String(raw.wallet_address ?? "");
  if (!wallet) return null;
  const type = raw.type === "claim" || raw.type === "restake" ? raw.type : "deposit";
  return {
    wallet_address: wallet,
    type,
    tx_sig: raw.tx_sig ? String(raw.tx_sig) : raw.tx_signature ? String(raw.tx_signature) : undefined,
    ts: Number(raw.ts ?? Math.floor(Date.now() / 1000)),
    meta: typeof raw.meta === "object" && raw.meta ? raw.meta : undefined,
  };
}

function loadState(): DbState {
  if (!fs.existsSync(DB_FILE)) return { positions: [], txs: [] };
  try {
    const contents = fs.readFileSync(DB_FILE, "utf-8");
    const parsed = JSON.parse(contents);
    const positions = Array.isArray(parsed?.positions)
      ? parsed.positions.map(normalizePosition).filter(Boolean) as Position[]
      : [];
    const txs = Array.isArray(parsed?.txs)
      ? parsed.txs.map(normalizeTx).filter(Boolean) as TxRecord[]
      : [];
    return { positions, txs };
  } catch (e) {
    console.error("[db] Failed to load storage.json, starting fresh", e);
    return { positions: [], txs: [] };
  }
}

const state: DbState = loadState();

function persist() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), "utf-8");
  } catch (e) {
    console.error("[db] Failed to persist storage.json", e);
  }
}

export const db = {
  createPosition(args: {
    wallet_address: string;
    amount_sol: number;
    lock_plan: LockPlan;
    start_ts?: number;
    tx_signature?: string | null;
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
      tx_signature: args.tx_signature ?? null,
    };
    if (p.tx_signature && state.positions.some(existing => existing.tx_signature === p.tx_signature)) {
      return state.positions.find(existing => existing.tx_signature === p.tx_signature)!;
    }
    state.positions.push(p);
    persist();
    return p;
  },
  listPositionsByWallet(wallet: string): DerivedPosition[] {
    let now = Math.floor(Date.now() / 1000);
    try {
      const { getDemoNow } = require("@/app/api/demo/cron/route");
      now = getDemoNow();
    } catch {}
    return state.positions
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
    return state.positions.find(p => p.id === id) ?? null;
  },
  findPositionBySignature(signature: string): Position | null {
    return state.positions.find(p => p.tx_signature === signature) ?? null;
  },
  markClaimed(id: string): Position | null {
    const p = state.positions.find(x => x.id === id);
    if (!p) return null;
    p.status = "claimed";
    persist();
    return p;
  },
  addTx(tx: TxRecord) {
    if (tx.tx_sig && state.txs.some(existing => existing.tx_sig === tx.tx_sig)) {
      return;
    }
    state.txs.push(tx);
    persist();
  },
  findTxBySignature(signature: string): TxRecord | null {
    return state.txs.find(t => t.tx_sig === signature) ?? null;
  },
  stats() {
    const tvl = state.positions.filter(p => p.status !== "claimed").reduce((sum, p) => sum + p.amount_sol, 0);
    const totalStakers = new Set(state.positions.map(p => p.wallet_address)).size;
    const totalDistributed = state.positions.filter(p => p.status === "claimed").reduce((sum, p) => sum + p.claimed_pboxc, 0);
    return { tvl, totalStakers, totalDistributed };
  }
};
