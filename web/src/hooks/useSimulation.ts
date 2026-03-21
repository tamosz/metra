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
import { buildScenarios } from '../utils/scenario-builder.js';

export interface KbConfig {
  bossAttackInterval: number;
  bossAccuracy: number;
}

export interface SimulationData {
  results: ScenarioResult[];
  classNames: string[];
  error: Error | null;
}

export interface SimulationOptions {
  targetCount?: number;
  elementModifiers?: Record<string, number>;
  buffOverrides?: BuffOverrides;
  kbConfig?: KbConfig;
  efficiencyOverrides?: Record<string, number[]>;
}

export function useSimulation(options: SimulationOptions = {}): SimulationData {
  const { targetCount, elementModifiers, buffOverrides, kbConfig, efficiencyOverrides } = options;
  return useMemo(() => {
    const { classNames, classDataMap, builds } = discoveredData;

    try {
      const scenarios = buildScenarios({ targetCount, elementModifiers, buffOverrides, kbConfig, efficiencyOverrides });
      const config: SimulationConfig = { classes: classNames, scenarios };

      const results = runSimulation(
        config,
        classDataMap,
        builds,
        weaponData,
        attackSpeedData,
        mwData
      );

      return { results, classNames, error: null };
    } catch (e) {
      return { results: [], classNames, error: e instanceof Error ? e : new Error(String(e)) };
    }
  }, [targetCount, elementModifiers, buffOverrides, kbConfig, efficiencyOverrides]);
}
