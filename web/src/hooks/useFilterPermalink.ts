import { useEffect, useRef } from 'react';
import type { SimulationControlsContextType } from '../context/SimulationControlsContext.js';
import { FILTER_DEFAULTS } from '../utils/filter-defaults.js';
import { CGS_DEFAULTS } from '../utils/cgs.js';
import { DEFAULT_SKILL_GROUPS } from '../utils/skill-groups.js';
import { type FilterState, setFilterInUrl, clearFilterFromUrl } from '../utils/filter-url.js';

function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}

function buildFilterState(controls: SimulationControlsContextType): FilterState {
  const state: FilterState = {};

  if (controls.selectedTier !== FILTER_DEFAULTS.tier) {
    state.tier = controls.selectedTier;
  }

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

  const tierDefaults = CGS_DEFAULTS[controls.selectedTier] ?? CGS_DEFAULTS.perfect;
  if (
    controls.cgsValues.cape !== tierDefaults.cape ||
    controls.cgsValues.glove !== tierDefaults.glove ||
    controls.cgsValues.shoe !== tierDefaults.shoe
  ) {
    state.cgs = controls.cgsValues;
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

export function useFilterPermalink(controls: SimulationControlsContextType): void {
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      return;
    }

    const state = buildFilterState(controls);
    if (Object.keys(state).length === 0) {
      clearFilterFromUrl();
    } else {
      setFilterInUrl(state);
    }
  }, [
    controls.selectedTier,
    controls.buffOverrides,
    controls.elementModifiers,
    controls.kbEnabled,
    controls.bossAttackInterval,
    controls.bossAccuracy,
    controls.targetCount,
    controls.capEnabled,
    controls.cgsValues,
    controls.activeGroups,
    controls.breakdownEnabled,
  ]);
}
