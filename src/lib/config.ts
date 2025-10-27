export const BASE_RATE = 100;

export const LOCK_MULTIPLIERS = {
	"1m": 1.1,
	"3m": 1.25,
	"6m": 1.5,
	"12m": 2.0,
} as const;

export type LockPlan = keyof typeof LOCK_MULTIPLIERS;

export const LOCK_DURATIONS_SECS: Record<LockPlan, number> = {
	"1m": 30 * 86400,
	"3m": 90 * 86400,
	"6m": 180 * 86400,
	"12m": 365 * 86400,
};

export const DEPOSIT_ADDRESS = "H3jXM8TVeVH9MYEXNipRZKNTErUDySaZdSinVqnKVyak";

export const STAKING_PAUSED = false;

export const DEFAULT_CLUSTER = process.env.NEXT_PUBLIC_SOLANA_CLUSTER ?? "devnet";

// Back-compat alias used across the app
export const CONTRACT_ADDRESS = DEPOSIT_ADDRESS;

export function getPlanLabel(plan: LockPlan): string {
	switch (plan) {
		case "1m": return "1 Month";
		case "3m": return "3 Months";
		case "6m": return "6 Months";
		case "12m": return "12 Months";
		default: return plan as string;
	}
}

export function getNetworkLabel(cluster: string): "Mainnet" | "Devnet" {
	return cluster === "mainnet" || cluster === "mainnet-beta" ? "Mainnet" : "Devnet";
} 
