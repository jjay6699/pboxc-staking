import { BASE_RATE, LOCK_MULTIPLIERS, LockPlan } from "@/lib/config";

export type StakingSettings = {
  baseRate: number;
  minDepositSol: number;
  maxDepositSol: number;
  stakingPaused: boolean;
  multipliers: Record<LockPlan, number>;
  updatedAt: number;
};

export const DEFAULT_STAKING_SETTINGS: StakingSettings = {
  baseRate: BASE_RATE,
  minDepositSol: 0.01,
  maxDepositSol: 1000,
  stakingPaused: false,
  multipliers: { ...LOCK_MULTIPLIERS },
  updatedAt: 0,
};

export function normalizeStakingSettings(value: Partial<StakingSettings> | null | undefined): StakingSettings {
  const multipliers = value?.multipliers ?? DEFAULT_STAKING_SETTINGS.multipliers;
  return {
    baseRate: positiveNumber(value?.baseRate, DEFAULT_STAKING_SETTINGS.baseRate),
    minDepositSol: positiveNumber(value?.minDepositSol, DEFAULT_STAKING_SETTINGS.minDepositSol),
    maxDepositSol: positiveNumber(value?.maxDepositSol, DEFAULT_STAKING_SETTINGS.maxDepositSol),
    stakingPaused: value?.stakingPaused === true,
    multipliers: {
      "1m": positiveNumber(multipliers["1m"], DEFAULT_STAKING_SETTINGS.multipliers["1m"]),
      "3m": positiveNumber(multipliers["3m"], DEFAULT_STAKING_SETTINGS.multipliers["3m"]),
      "6m": positiveNumber(multipliers["6m"], DEFAULT_STAKING_SETTINGS.multipliers["6m"]),
      "12m": positiveNumber(multipliers["12m"], DEFAULT_STAKING_SETTINGS.multipliers["12m"]),
    },
    updatedAt: Number(value?.updatedAt ?? 0),
  };
}

function positiveNumber(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
