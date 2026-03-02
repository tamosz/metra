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
import type { CustomTier } from '../types/custom-tier.js';
import { generateCustomTierTemplates } from '../utils/custom-tier.js';
import type { BuffOverrides } from '../components/BuffToggles.js';

export interface SimulationData {
  results: ScenarioResult[];
  classNames: string[];
  tiers: string[];
  /** Maps custom tier IDs to their display names. */
  customTierNames: Map<string, string>;
}

export function useSimulation(
  customTiers: CustomTier[] = [],
  targetCount?: number,
  elementModifiers?: Record<string, number>,
  buffOverrides?: BuffOverrides,
): SimulationData {
  return useMemo(() => {
    const { classNames, tiers, classDataMap, gearTemplates } = discoveredData;

    // Merge custom tier templates into the gear templates map
    const allTiers = [...tiers];
    const mergedTemplates = new Map(gearTemplates);
    const customTierNames = new Map<string, string>();

    for (const ct of customTiers) {
      const generated = generateCustomTierTemplates(ct, classNames, classDataMap, gearTemplates);
      for (const [key, build] of generated) {
        mergedTemplates.set(key, build);
      }
      allTiers.push(ct.id);
      customTierNames.set(ct.id, ct.name);
    }

    const hasElementMods = elementModifiers && Object.keys(elementModifiers).length > 0;
    const hasBuffOverrides = buffOverrides && Object.keys(buffOverrides).length > 0;
    // Build a single scenario from controls
    const scenario: ScenarioConfig = { name: 'Baseline' };
    if (hasElementMods) scenario.elementModifiers = { ...elementModifiers };
    if (hasBuffOverrides) scenario.overrides = { ...buffOverrides };
    const scenarios: ScenarioConfig[] = [scenario];
    if (targetCount != null && targetCount > 1) {
      const training: ScenarioConfig = { name: `Training (${targetCount} mobs)`, targetCount };
      if (hasElementMods) training.elementModifiers = { ...elementModifiers };
      if (hasBuffOverrides) training.overrides = { ...buffOverrides };
      scenarios.push(training);
    }

    const config: SimulationConfig = {
      classes: classNames,
      tiers: allTiers,
      scenarios,
    };

    const results = runSimulation(
      config,
      classDataMap,
      mergedTemplates,
      weaponData,
      attackSpeedData,
      mwData
    );

    return { results, classNames, tiers: allTiers, customTierNames };
  }, [customTiers, targetCount, elementModifiers, buffOverrides]);
}
