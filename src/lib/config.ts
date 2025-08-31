export const BASE_RATE = 100;

export const LOCK_MULTIPLIERS = {
	"1w": 1.0,
	"1m": 1.1,
	"3m": 1.25,
	"6m": 1.5,
	"12m": 2.0,
} as const;

export type LockPlan = keyof typeof LOCK_MULTIPLIERS;

export const LOCK_DURATIONS_SECS: Record<LockPlan, number> = {
	"1w": 7 * 86400,
	"1m": 30 * 86400,
	"3m": 90 * 86400,
	"6m": 180 * 86400,
	"12m": 365 * 86400,
};

export const DEPOSIT_ADDRESS = "326EeauJgTEuNMbSEsTXiaNkq1yLBi1Ftkm5sataJfH8";

export const STAKING_PAUSED = false;

export const DEFAULT_CLUSTER = process.env.NEXT_PUBLIC_SOLANA_CLUSTER ?? "devnet";

export function getNetworkLabel(cluster: string): "Mainnet" | "Devnet" {
	return cluster === "mainnet" || cluster === "mainnet-beta" ? "Mainnet" : "Devnet";
} 