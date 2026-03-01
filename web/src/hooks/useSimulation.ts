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

export interface SimulationData {
  results: ScenarioResult[];
  classNames: string[];
  tiers: string[];
  scenarios: string[];
}

export function useSimulation(): SimulationData {
  return useMemo(() => {
    const { classNames, tiers, classDataMap, gearTemplates } = discoverClassesAndTiers();

    const config: SimulationConfig = {
      classes: classNames,
      tiers,
      scenarios: DEFAULT_SCENARIOS,
    };

    const results = runSimulation(
      config,
      classDataMap,
      gearTemplates,
      weaponData,
      attackSpeedData,
      mwData
    );

    const scenarios = DEFAULT_SCENARIOS.map((s) => s.name);
    return { results, classNames, tiers, scenarios };
  }, []);
}
