import type { ScenarioConfig } from './proposals/types.js';

export const DEFAULT_SCENARIOS: ScenarioConfig[] = [
  { name: 'Buffed' },
  {
    name: 'Bossing (50% PDR)',
    pdr: 0.5,
  },
  {
    name: 'Bossing (KB)',
    pdr: 0.5,
    bossAttackInterval: 1.5,
    bossAccuracy: 250,
  },
];
