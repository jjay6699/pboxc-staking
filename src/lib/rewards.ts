import { BASE_RATE, LOCK_DURATIONS_SECS, LOCK_MULTIPLIERS, LockPlan } from "@/lib/config";

export function getPlanSeconds(plan: LockPlan): number {
	return LOCK_DURATIONS_SECS[plan];
}

export function getDaysElapsed(startTs: number, plan: LockPlan, nowTs?: number): number {
	const now = nowTs ?? Math.floor(Date.now() / 1000);
	const elapsed = now - startTs;
	const maxDays = Math.floor(getPlanSeconds(plan) / 86400);
	return Math.max(0, Math.min(maxDays, Math.floor(elapsed / 86400)));
}

export function getAccruedCrex(
	amountSol: number,
	plan: LockPlan,
	startTs: number,
	nowTs?: number,
	multiplierOverride?: number,
	baseRateOverride?: number,
): number {
	const days = getDaysElapsed(startTs, plan, nowTs);
	const multiplier = multiplierOverride ?? LOCK_MULTIPLIERS[plan];
	const baseRate = baseRateOverride ?? BASE_RATE;
	return amountSol * baseRate * multiplier * days;
}

export function getMaturityTs(startTs: number, plan: LockPlan): number {
	return startTs + getPlanSeconds(plan);
}

export function isClaimable(startTs: number, plan: LockPlan, nowTs?: number): boolean {
	const now = nowTs ?? Math.floor(Date.now() / 1000);
	return now >= getMaturityTs(startTs, plan);
} 
