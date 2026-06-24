"use client";

import { useEffect, useState } from "react";
import { DEFAULT_STAKING_SETTINGS, StakingSettings } from "@/lib/stakingSettings";
import { apiGet } from "@/lib/api";

let cachedSettings: StakingSettings | null = null;

export function useStakingSettings() {
  const [settings, setSettings] = useState<StakingSettings>(cachedSettings ?? DEFAULT_STAKING_SETTINGS);

  useEffect(() => {
    let cancelled = false;
    apiGet<{ settings: StakingSettings }>("/api/settings")
      .then((response) => {
        cachedSettings = response.settings;
        if (!cancelled) setSettings(response.settings);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  return settings;
}
