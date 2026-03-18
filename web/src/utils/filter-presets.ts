import type { PresetFilterState } from './filter-state.js';

export interface FilterPreset {
  id: string;
  name: string;
  state: PresetFilterState;
  builtIn: boolean;
}

export const BUILTIN_PRESETS: FilterPreset[] = [
  { id: 'builtin-bossing', name: 'Bossing', state: {}, builtIn: true },
  { id: 'builtin-training', name: 'Training', state: { targets: 15, groups: ['main', 'multi-target'] }, builtIn: true },
  {
    id: 'builtin-unbuffed',
    name: 'Unbuffed',
    state: {
      buffs: { sharpEyes: false, echoActive: false, speedInfusion: false, mwLevel: 0, attackPotion: 0 },
    },
    builtIn: true,
  },
];

const USER_KEY = 'royals-sim:filter-presets';
const DISMISSED_KEY = 'royals-sim:filter-presets:dismissed';

export function loadUserPresets(): FilterPreset[] {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as FilterPreset[];
  } catch {
    return [];
  }
}

export function saveUserPresets(presets: FilterPreset[]): void {
  localStorage.setItem(USER_KEY, JSON.stringify(presets));
}

export function loadDismissedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

export function saveDismissedIds(ids: Set<string>): void {
  localStorage.setItem(DISMISSED_KEY, JSON.stringify([...ids]));
}

export function mergePresets(userPresets: FilterPreset[], dismissedIds: Set<string>): FilterPreset[] {
  const builtIns = BUILTIN_PRESETS.filter((p) => !dismissedIds.has(p.id));
  return [...builtIns, ...userPresets];
}
