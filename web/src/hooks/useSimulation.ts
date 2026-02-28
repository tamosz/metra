import { useMemo } from 'react';
import { runSimulation } from '@engine/proposals/simulate.js';
import type { SimulationConfig } from '@engine/proposals/simulate.js';
import type { ScenarioConfig, ScenarioResult } from '@engine/proposals/types.js';
import {
  discoverClassesAndTiers,
  weaponData,
  attackSpeedData,
  mapleWarriorData,
} from '../data/bundle.js';

const DEFAULT_SCENARIOS: ScenarioConfig[] = [
  { name: 'Buffed' },
  {
    name: 'Unbuffed',
    overrides: {
      sharpEyes: false,
      echoActive: false,
      speedInfusion: false,
      mapleWarriorLevel: 0,
      attackPotion: 0,
    },
  },
  {
    name: 'No-Echo',
    overrides: { echoActive: false },
  },
  {
    name: 'Bossing (50% PDR)',
    pdr: 0.5,
  },
];

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
      mapleWarriorData
    );

    const scenarios = DEFAULT_SCENARIOS.map((s) => s.name);
    return { results, classNames, tiers, scenarios };
  }, []);
}
