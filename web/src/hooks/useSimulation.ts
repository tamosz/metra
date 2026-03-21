import { useMemo } from 'react';
import { runSimulation } from '@engine/proposals/simulate.js';
import type { SimulationConfig } from '@engine/proposals/simulate.js';
import type { ScenarioResult } from '@engine/proposals/types.js';

import {
  discoveredData,
  weaponData,
  attackSpeedData,
  mwData,
} from '../data/bundle.js';
import type { BuffOverrides } from '../components/BuffToggles.js';
import type { CgsValues } from '../utils/cgs.js';
import { buildScenarios, prepareTemplates } from '../utils/scenario-builder.js';

export interface KbConfig {
  bossAttackInterval: number;
  bossAccuracy: number;
}

export interface SimulationData {
  results: ScenarioResult[];
  classNames: string[];
  tiers: string[];
  error: Error | null;
}

export interface SimulationOptions {
  targetCount?: number;
  elementModifiers?: Record<string, number>;
  buffOverrides?: BuffOverrides;
  kbConfig?: KbConfig;
  cgsOverride?: { tier: string; values: CgsValues };
  efficiencyOverrides?: Record<string, number[]>;
}

export function useSimulation(options: SimulationOptions = {}): SimulationData {
  const { targetCount, elementModifiers, buffOverrides, kbConfig, cgsOverride, efficiencyOverrides } = options;
  return useMemo(() => {
    const { classNames, tiers, classDataMap, gearTemplates } = discoveredData;

    try {
      const finalTemplates = prepareTemplates(gearTemplates, classDataMap, classNames, cgsOverride);
      const scenarios = buildScenarios(options);
      const config: SimulationConfig = { classes: classNames, tiers, scenarios };

      const results = runSimulation(
        config,
        classDataMap,
        finalTemplates,
        weaponData,
        attackSpeedData,
        mwData
      );

      return { results, classNames, tiers, error: null };
    } catch (e) {
      return { results: [], classNames, tiers, error: e instanceof Error ? e : new Error(String(e)) };
    }
  }, [targetCount, elementModifiers, buffOverrides, kbConfig, cgsOverride, efficiencyOverrides]);
}
