import { useMemo } from 'react';
import { runSimulation } from '@engine/proposals/simulate.js';
import type { SimulationConfig } from '@engine/proposals/simulate.js';
import type { ScenarioConfig, ScenarioResult } from '@engine/proposals/types.js';
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

export function useSimulation(
  customTiers: CustomTier[] = [],
  targetCount?: number,
  elementModifiers?: Record<string, number>,
): SimulationData {
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

    const hasElementMods = elementModifiers && Object.keys(elementModifiers).length > 0;
    const scenarios: ScenarioConfig[] = DEFAULT_SCENARIOS.map((s) => {
      if (!hasElementMods) return s;
      return { ...s, elementModifiers: { ...s.elementModifiers, ...elementModifiers } };
    });
    if (targetCount != null && targetCount > 1) {
      const training: ScenarioConfig = { name: `Training (${targetCount} mobs)`, targetCount };
      if (hasElementMods) training.elementModifiers = { ...elementModifiers };
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

    const scenarioNames = scenarios.map((s) => s.name);
    return { results, classNames, tiers: allTiers, scenarios: scenarioNames, customTierNames };
  }, [customTiers, targetCount, elementModifiers]);
}
