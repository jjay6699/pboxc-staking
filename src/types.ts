import { LockPlan } from "@/lib/config";

export type PositionStatus = "active" | "matured" | "claimed";

export type Position = {
  id: string;
  wallet_address: string;
  amount_sol: number;
  lock_plan: LockPlan;
  lock_multiplier: number;
  start_ts: number; // seconds
  maturity_ts: number; // seconds
  status: PositionStatus; // persisted; "matured" can be derived at read
  claimed_pboxc: number;
};

export type DerivedPosition = Position & {
  days_elapsed: number;
  accrued_pboxc: number;
  claimable: boolean;
};

export type TxType = "deposit" | "claim" | "restake";

export type TxRecord = {
  wallet_address: string;
  type: TxType;
  tx_sig?: string | null;
  ts: number; // seconds
  meta?: Record<string, unknown>;
}; 