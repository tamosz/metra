import type { SimulationFiltersContextType } from '../context/SimulationFiltersContext.js';
import { FILTER_DEFAULTS } from './filter-defaults.js';
import { DEFAULT_SKILL_GROUPS } from './skill-groups.js';
import type { FilterState } from './filter-url.js';

export type PresetFilterState = FilterState;

function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}

export function buildFilterState(controls: SimulationFiltersContextType): FilterState {
  const state: FilterState = {};

  if (Object.keys(controls.buffOverrides).length > 0) {
    state.buffs = controls.buffOverrides;
  }

  if (Object.keys(controls.elementModifiers).length > 0) {
    state.elements = controls.elementModifiers;
  }

  if (controls.kbEnabled) {
    const kb: FilterState['kb'] = {};
    if (controls.bossAttackInterval !== FILTER_DEFAULTS.bossAttackInterval) {
      kb.interval = controls.bossAttackInterval;
    }
    if (controls.bossAccuracy !== FILTER_DEFAULTS.bossAccuracy) {
      kb.accuracy = controls.bossAccuracy;
    }
    state.kb = kb;
  }

  if (controls.targetCount !== FILTER_DEFAULTS.targetCount) {
    state.targets = controls.targetCount;
  }

  if (controls.capEnabled !== FILTER_DEFAULTS.capEnabled) {
    state.cap = controls.capEnabled;
  }

  const defaultGroups = new Set<string>(DEFAULT_SKILL_GROUPS);
  if (!setsEqual(controls.activeGroups as Set<string>, defaultGroups)) {
    state.groups = [...controls.activeGroups].sort();
  }

  if (controls.breakdownEnabled !== FILTER_DEFAULTS.breakdownEnabled) {
    state.breakdown = controls.breakdownEnabled;
  }

  return state;
}

function shallowObjectEqual(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const k of keysA) {
    if (a[k] !== b[k]) return false;
  }
  return true;
}

export function filterStatesEqual(a: PresetFilterState, b: PresetFilterState): boolean {
  const keysA = Object.keys(a) as (keyof PresetFilterState)[];
  const keysB = Object.keys(b) as (keyof PresetFilterState)[];

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!(key in b)) return false;

    const va = a[key];
    const vb = b[key];

    if (key === 'groups') {
      const ga = [...(va as string[])].sort();
      const gb = [...(vb as string[])].sort();
      if (ga.length !== gb.length || ga.some((v, i) => v !== gb[i])) return false;
    } else if (typeof va === 'object' && va !== null) {
      if (!shallowObjectEqual(va as Record<string, unknown>, vb as Record<string, unknown>)) return false;
    } else {
      if (va !== vb) return false;
    }
  }

  return true;
}
