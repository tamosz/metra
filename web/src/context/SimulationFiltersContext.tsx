import { createContext, useCallback, useContext, useState, useMemo, type ReactNode } from 'react';
import type { BuffOverrides } from '../components/BuffToggles.js';
import type { KbConfig } from '../hooks/useSimulation.js';
import { FILTER_DEFAULTS, defaultActiveGroups, defaultBuffOverrides, defaultElementModifiers } from '../utils/filter-defaults.js';
import type { SkillGroupId } from '../utils/skill-groups.js';

export interface SimulationFiltersContextType {
  targetCount: number;
  setTargetCount: (n: number) => void;
  elementModifiers: Record<string, number>;
  setElementModifiers: (mods: Record<string, number>) => void;
  buffOverrides: BuffOverrides;
  setBuffOverrides: (overrides: BuffOverrides) => void;
  kbEnabled: boolean;
  setKbEnabled: (enabled: boolean) => void;
  bossAttackInterval: number;
  setBossAttackInterval: (n: number) => void;
  bossAccuracy: number;
  setBossAccuracy: (n: number) => void;
  capEnabled: boolean;
  setCapEnabled: (enabled: boolean) => void;
  kbConfig: KbConfig | undefined;
  efficiencyOverrides: Record<string, number[]>;
  setEfficiencyOverrides: (overrides: Record<string, number[]>) => void;
  breakdownEnabled: boolean;
  setBreakdownEnabled: (enabled: boolean) => void;
  activeGroups: Set<SkillGroupId>;
  setActiveGroups: (groups: Set<SkillGroupId>) => void;
  toggleGroup: (id: SkillGroupId) => void;
  resetFilters: () => void;
}

const SimulationFiltersContext = createContext<SimulationFiltersContextType | null>(null);

export function SimulationFiltersProvider({ children }: { children: ReactNode }) {
  const [targetCount, setTargetCount] = useState(FILTER_DEFAULTS.targetCount);
  const [elementModifiers, setElementModifiers] = useState<Record<string, number>>({});
  const [buffOverrides, setBuffOverrides] = useState<BuffOverrides>({});
  const [kbEnabled, setKbEnabled] = useState(FILTER_DEFAULTS.kbEnabled);
  const [bossAttackInterval, setBossAttackInterval] = useState(FILTER_DEFAULTS.bossAttackInterval);
  const [bossAccuracy, setBossAccuracy] = useState(FILTER_DEFAULTS.bossAccuracy);
  const [capEnabled, setCapEnabled] = useState(FILTER_DEFAULTS.capEnabled);
  const [efficiencyOverrides, setEfficiencyOverrides] = useState<Record<string, number[]>>({});
  const [breakdownEnabled, setBreakdownEnabled] = useState(FILTER_DEFAULTS.breakdownEnabled);
  const [activeGroups, setActiveGroups] = useState<Set<SkillGroupId>>(defaultActiveGroups);

  const resetFilters = useCallback(() => {
    setTargetCount(FILTER_DEFAULTS.targetCount);
    setCapEnabled(FILTER_DEFAULTS.capEnabled);
    setKbEnabled(FILTER_DEFAULTS.kbEnabled);
    setBossAttackInterval(FILTER_DEFAULTS.bossAttackInterval);
    setBossAccuracy(FILTER_DEFAULTS.bossAccuracy);
    setBreakdownEnabled(FILTER_DEFAULTS.breakdownEnabled);
    setBuffOverrides(defaultBuffOverrides());
    setElementModifiers(defaultElementModifiers());
    setEfficiencyOverrides({});
    setActiveGroups(defaultActiveGroups());
  }, []);

  const toggleGroup = useCallback((id: SkillGroupId) => {
    setActiveGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const kbConfig = useMemo(
    () => (kbEnabled ? { bossAttackInterval, bossAccuracy } : undefined),
    [kbEnabled, bossAttackInterval, bossAccuracy],
  );

  const value = useMemo(
    () => ({
      targetCount,
      setTargetCount,
      elementModifiers,
      setElementModifiers,
      buffOverrides,
      setBuffOverrides,
      kbEnabled,
      setKbEnabled,
      bossAttackInterval,
      setBossAttackInterval,
      bossAccuracy,
      setBossAccuracy,
      capEnabled,
      setCapEnabled,
      kbConfig,
      efficiencyOverrides,
      setEfficiencyOverrides,
      breakdownEnabled,
      setBreakdownEnabled,
      activeGroups,
      setActiveGroups,
      toggleGroup,
      resetFilters,
    }),
    [targetCount, elementModifiers, buffOverrides, kbEnabled, bossAttackInterval, bossAccuracy, capEnabled, kbConfig, efficiencyOverrides, breakdownEnabled, activeGroups, toggleGroup, resetFilters],
  );

  return (
    <SimulationFiltersContext.Provider value={value}>
      {children}
    </SimulationFiltersContext.Provider>
  );
}

export function useSimulationFilters(): SimulationFiltersContextType {
  const context = useContext(SimulationFiltersContext);
  if (!context) {
    throw new Error('useSimulationFilters must be used within a SimulationFiltersProvider');
  }
  return context;
}
