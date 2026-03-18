import { useEffect, useRef } from 'react';
import type { SimulationControlsContextType } from '../context/SimulationControlsContext.js';
import { setFilterInUrl, clearFilterFromUrl } from '../utils/filter-url.js';
import { buildFilterState } from '../utils/filter-state.js';

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
