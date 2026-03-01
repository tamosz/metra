import { useMemo } from 'react';
import { runSimulation } from '@engine/proposals/simulate.js';
import type { SimulationConfig } from '@engine/proposals/simulate.js';
import type { ScenarioResult } from '@engine/proposals/types.js';
import { DEFAULT_SCENARIOS } from '@engine/scenarios.js';
import {
  discoverClassesAndTiers,
  weaponData,
  attackSpeedData,
  mwData,
} from '../data/bundle.js';
import type { CustomTier } from '../types/custom-tier.js';
import { generateCustomTierTemplates } from '../utils/custom-tier.js';

export interface SimulationData {
  results: ScenarioResult[];
  classNames: string[];
  tiers: string[];
  scenarios: string[];
  /** Maps custom tier IDs to their display names. */
  customTierNames: Map<string, string>;
}

export function useSimulation(customTiers: CustomTier[] = []): SimulationData {
  return useMemo(() => {
    const { classNames, tiers, classDataMap, gearTemplates } = discoverClassesAndTiers();

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

    const config: SimulationConfig = {
      classes: classNames,
      tiers: allTiers,
      scenarios: DEFAULT_SCENARIOS,
    };

    const results = runSimulation(
      config,
      classDataMap,
      mergedTemplates,
      weaponData,
      attackSpeedData,
      mwData
    );

    const scenarios = DEFAULT_SCENARIOS.map((s) => s.name);
    return { results, classNames, tiers: allTiers, scenarios, customTierNames };
  }, [customTiers]);
}
