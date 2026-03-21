import { useState, useMemo, useCallback } from 'react';
import { useSimulationFilters } from '../context/SimulationFiltersContext.js';
import { buildFilterState, stripCgs, filterStatesEqual, type PresetFilterState } from '../utils/filter-state.js';
import {
  type FilterPreset,
  loadUserPresets,
  saveUserPresets,
  loadDismissedIds,
  saveDismissedIds,
  mergePresets,
} from '../utils/filter-presets.js';
import { FILTER_DEFAULTS, defaultActiveGroups, defaultBuffOverrides, defaultElementModifiers } from '../utils/filter-defaults.js';
import type { SkillGroupId } from '../utils/skill-groups.js';

export interface FilterPresetsState {
  presets: FilterPreset[];
  activePresetId: string | null;
  isDirty: boolean;
  save: (name: string) => void;
  remove: (id: string) => void;
  apply: (id: string) => void;
  revert: () => void;
  deselect: () => void;
}

export function useFilterPresets(): FilterPresetsState {
  const controls = useSimulationFilters();

  const [userPresets, setUserPresets] = useState<FilterPreset[]>(() => loadUserPresets());
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => loadDismissedIds());
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  const presets = useMemo(() => mergePresets(userPresets, dismissedIds), [userPresets, dismissedIds]);

  const activePreset = useMemo(
    () => (activePresetId ? presets.find((p) => p.id === activePresetId) ?? null : null),
    [activePresetId, presets],
  );

  const isDirty = useMemo(() => {
    if (!activePreset) return false;
    const current = stripCgs(buildFilterState(controls));
    return !filterStatesEqual(current, activePreset.state);
  }, [
    activePreset,
    controls.selectedTier,
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

  const applyState = useCallback(
    (state: PresetFilterState) => {
      // Reset preset-managed controls to defaults
      controls.setSelectedTier(FILTER_DEFAULTS.tier);
      controls.setBuffOverrides(defaultBuffOverrides());
      controls.setElementModifiers(defaultElementModifiers());
      controls.setKbEnabled(FILTER_DEFAULTS.kbEnabled);
      controls.setBossAttackInterval(FILTER_DEFAULTS.bossAttackInterval);
      controls.setBossAccuracy(FILTER_DEFAULTS.bossAccuracy);
      controls.setTargetCount(FILTER_DEFAULTS.targetCount);
      controls.setCapEnabled(FILTER_DEFAULTS.capEnabled);
      controls.setActiveGroups(defaultActiveGroups());
      controls.setBreakdownEnabled(FILTER_DEFAULTS.breakdownEnabled);

      // Overlay preset values
      if (state.tier !== undefined) controls.setSelectedTier(state.tier);
      if (state.buffs) controls.setBuffOverrides(state.buffs);
      if (state.elements) controls.setElementModifiers(state.elements);
      if (state.kb) {
        controls.setKbEnabled(true);
        if (state.kb.interval !== undefined) controls.setBossAttackInterval(state.kb.interval);
        if (state.kb.accuracy !== undefined) controls.setBossAccuracy(state.kb.accuracy);
      }
      if (state.targets !== undefined) controls.setTargetCount(state.targets);
      if (state.cap !== undefined) controls.setCapEnabled(state.cap);
      if (state.groups) controls.setActiveGroups(new Set(state.groups as SkillGroupId[]));
      if (state.breakdown !== undefined) controls.setBreakdownEnabled(state.breakdown);
    },
    [controls],
  );

  const apply = useCallback(
    (id: string) => {
      const preset = presets.find((p) => p.id === id);
      if (!preset) return;
      setActivePresetId(id);
      applyState(preset.state);
    },
    [presets, applyState],
  );

  const revert = useCallback(() => {
    if (activePresetId) {
      const preset = presets.find((p) => p.id === activePresetId);
      if (preset) applyState(preset.state);
    }
  }, [activePresetId, presets, applyState]);

  const deselect = useCallback(() => {
    setActivePresetId(null);
  }, []);

  const save = useCallback(
    (name: string) => {
      const state = stripCgs(buildFilterState(controls));
      const id = 'preset-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const preset: FilterPreset = { id, name, state, builtIn: false };
      const current = loadUserPresets();
      const next = [...current, preset];
      setUserPresets(next);
      saveUserPresets(next);
      setActivePresetId(id);
    },
    [controls],
  );

  const remove = useCallback(
    (id: string) => {
      if (id.startsWith('builtin-')) {
        const current = loadDismissedIds();
        current.add(id);
        setDismissedIds(current);
        saveDismissedIds(current);
      } else {
        const next = loadUserPresets().filter((p) => p.id !== id);
        setUserPresets(next);
        saveUserPresets(next);
      }
      setActivePresetId((prev) => (prev === id ? null : prev));
    },
    [],
  );

  return { presets, activePresetId, isDirty, save, remove, apply, revert, deselect };
}
