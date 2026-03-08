import { useMemo } from 'react';
import { runSimulation } from '@engine/proposals/simulate.js';
import type { SimulationConfig } from '@engine/proposals/simulate.js';
import type { ScenarioConfig, ScenarioResult } from '@engine/proposals/types.js';

import {
  discoveredData,
  weaponData,
  attackSpeedData,
  mwData,
} from '../data/bundle.js';
import type { BuffOverrides } from '../components/BuffToggles.js';
import { applyCgsOverride, type CgsValues } from '../utils/cgs.js';

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
      // Apply CGS override if provided
      let finalTemplates = new Map(gearTemplates);
      if (cgsOverride) {
        finalTemplates = applyCgsOverride(
          finalTemplates,
          classDataMap,
          classNames,
          cgsOverride.tier,
          cgsOverride.values,
        );
      }

      const hasElementMods = elementModifiers && Object.keys(elementModifiers).length > 0;
      const hasBuffOverrides = buffOverrides && Object.keys(buffOverrides).length > 0;
      const hasEfficiencyOverrides = efficiencyOverrides && Object.keys(efficiencyOverrides).length > 0;
      // Build a single scenario from controls
      const scenario: ScenarioConfig = { name: 'Baseline' };
      if (hasElementMods) scenario.elementModifiers = { ...elementModifiers };
      if (hasBuffOverrides) scenario.overrides = { ...buffOverrides };
      if (kbConfig) {
        scenario.bossAttackInterval = kbConfig.bossAttackInterval;
        scenario.bossAccuracy = kbConfig.bossAccuracy;
      }
      if (hasEfficiencyOverrides) scenario.efficiencyOverrides = { ...efficiencyOverrides };
      const scenarios: ScenarioConfig[] = [scenario];
      if (targetCount != null && targetCount > 1) {
        const training: ScenarioConfig = { name: `Training (${targetCount} mobs)`, targetCount };
        if (hasElementMods) training.elementModifiers = { ...elementModifiers };
        if (hasBuffOverrides) training.overrides = { ...buffOverrides };
        if (kbConfig) {
          training.bossAttackInterval = kbConfig.bossAttackInterval;
          training.bossAccuracy = kbConfig.bossAccuracy;
        }
        if (hasEfficiencyOverrides) training.efficiencyOverrides = { ...efficiencyOverrides };
        scenarios.push(training);
      }

      const config: SimulationConfig = {
        classes: classNames,
        tiers,
        scenarios,
      };

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
