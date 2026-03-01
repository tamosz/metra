import type { ScenarioConfig } from './proposals/types.js';

export const DEFAULT_SCENARIOS: ScenarioConfig[] = [
  { name: 'Buffed' },
  {
    name: 'Unbuffed',
    overrides: {
      sharpEyes: false,
      echoActive: false,
      speedInfusion: false,
      mwLevel: 0,
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
  {
    name: 'Bossing (Undead, 50% PDR)',
    pdr: 0.5,
    elementModifiers: { Holy: 1.5 },
  },
];
