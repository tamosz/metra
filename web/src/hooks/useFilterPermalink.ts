import { useEffect, useRef } from 'react';
import type { SimulationFiltersContextType } from '../context/SimulationFiltersContext.js';
import { setFilterInUrl, clearFilterFromUrl } from '../utils/filter-url.js';
import { buildFilterState } from '../utils/filter-state.js';

export function useFilterPermalink(controls: SimulationFiltersContextType): void {
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
    controls.buffOverrides,
    controls.elementModifiers,
    controls.kbEnabled,
    controls.bossAttackInterval,
    controls.bossAccuracy,
    controls.targetCount,
    controls.capEnabled,
    controls.activeGroups,
    controls.breakdownEnabled,
  ]);
}
