import { createContext, useCallback, useContext, useState, useMemo, type ReactNode } from 'react';
import type { BuffOverrides } from '../components/BuffToggles.js';
import { CGS_DEFAULTS, type CgsValues } from '../utils/cgs.js';
import type { KbConfig } from '../hooks/useSimulation.js';
import type { ProposalChange } from '@engine/proposals/types.js';

interface WhatIfMeta {
  name: string;
  author: string;
}

const EMPTY_WHAT_IF_META: WhatIfMeta = { name: '', author: '' };

interface SimulationControlsContextType {
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
  selectedTier: string;
  setSelectedTier: (tier: string) => void;
  cgsValues: CgsValues;
  setCgsValues: (values: CgsValues) => void;
  kbConfig: KbConfig | undefined;
  efficiencyOverrides: Record<string, number[]>;
  setEfficiencyOverrides: (overrides: Record<string, number[]>) => void;
  whatIfEnabled: boolean;
  setWhatIfEnabled: (enabled: boolean) => void;
  whatIfChanges: ProposalChange[];
  addWhatIfChange: (change: ProposalChange) => void;
  removeWhatIfChange: (index: number) => void;
  updateWhatIfChange: (index: number, change: ProposalChange) => void;
  clearWhatIfChanges: () => void;
  whatIfMeta: WhatIfMeta;
  setWhatIfMeta: (meta: WhatIfMeta) => void;
}

const SimulationControlsContext = createContext<SimulationControlsContextType | null>(null);

export function SimulationControlsProvider({ children }: { children: ReactNode }) {
  const [targetCount, setTargetCount] = useState(1);
  const [elementModifiers, setElementModifiers] = useState<Record<string, number>>({});
  const [buffOverrides, setBuffOverrides] = useState<BuffOverrides>({});
  const [kbEnabled, setKbEnabled] = useState(false);
  const [bossAttackInterval, setBossAttackInterval] = useState(1.5);
  const [bossAccuracy, setBossAccuracy] = useState(250);
  const [capEnabled, setCapEnabled] = useState(true);
  const [selectedTier, setSelectedTier] = useState('perfect');
  const [cgsValues, setCgsValues] = useState<CgsValues>({ ...CGS_DEFAULTS.perfect });
  const [efficiencyOverrides, setEfficiencyOverrides] = useState<Record<string, number[]>>({});
  const [whatIfEnabled, setWhatIfEnabledRaw] = useState(false);
  const [whatIfChanges, setWhatIfChanges] = useState<ProposalChange[]>([]);
  const [whatIfMeta, setWhatIfMetaRaw] = useState<WhatIfMeta>(EMPTY_WHAT_IF_META);

  const setWhatIfEnabled = useCallback((enabled: boolean) => {
    setWhatIfEnabledRaw(enabled);
    if (!enabled) {
      setWhatIfChanges([]);
      setWhatIfMetaRaw(EMPTY_WHAT_IF_META);
    }
  }, []);

  const addWhatIfChange = useCallback((change: ProposalChange) => {
    setWhatIfChanges((prev) => [...prev, change]);
  }, []);

  const removeWhatIfChange = useCallback((index: number) => {
    setWhatIfChanges((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateWhatIfChange = useCallback((index: number, change: ProposalChange) => {
    setWhatIfChanges((prev) => prev.map((c, i) => (i === index ? change : c)));
  }, []);

  const clearWhatIfChanges = useCallback(() => {
    setWhatIfChanges([]);
  }, []);

  const setWhatIfMeta = useCallback((meta: WhatIfMeta) => {
    setWhatIfMetaRaw(meta);
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
      selectedTier,
      setSelectedTier,
      cgsValues,
      setCgsValues,
      kbConfig,
      efficiencyOverrides,
      setEfficiencyOverrides,
      whatIfEnabled,
      setWhatIfEnabled,
      whatIfChanges,
      addWhatIfChange,
      removeWhatIfChange,
      updateWhatIfChange,
      clearWhatIfChanges,
      whatIfMeta,
      setWhatIfMeta,
    }),
    [targetCount, elementModifiers, buffOverrides, kbEnabled, bossAttackInterval, bossAccuracy, capEnabled, selectedTier, cgsValues, kbConfig, efficiencyOverrides, whatIfEnabled, whatIfChanges, whatIfMeta, setWhatIfEnabled, addWhatIfChange, removeWhatIfChange, updateWhatIfChange, clearWhatIfChanges, setWhatIfMeta],
  );

  return (
    <SimulationControlsContext.Provider value={value}>
      {children}
    </SimulationControlsContext.Provider>
  );
}

export function useSimulationControls(): SimulationControlsContextType {
  const context = useContext(SimulationControlsContext);
  if (!context) {
    throw new Error('useSimulationControls must be used within a SimulationControlsProvider');
  }
  return context;
}
