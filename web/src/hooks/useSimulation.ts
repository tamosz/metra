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

export interface SimulationData {
  results: ScenarioResult[];
  classNames: string[];
  tiers: string[];
  scenarios: string[];
}

export function useSimulation(targetCount?: number): SimulationData {
  return useMemo(() => {
    const { classNames, tiers, classDataMap, gearTemplates } = discoverClassesAndTiers();

    const scenarios: ScenarioConfig[] = [...DEFAULT_SCENARIOS];
    if (targetCount != null && targetCount > 1) {
      scenarios.push({
        name: `Training (${targetCount} mobs)`,
        targetCount,
      });
    }

    const config: SimulationConfig = {
      classes: classNames,
      tiers,
      scenarios,
    };

    const results = runSimulation(
      config,
      classDataMap,
      gearTemplates,
      weaponData,
      attackSpeedData,
      mwData
    );

    const scenarioNames = scenarios.map((s) => s.name);
    return { results, classNames, tiers, scenarios: scenarioNames };
  }, [targetCount]);
}
