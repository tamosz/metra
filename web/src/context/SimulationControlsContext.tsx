import { createContext, useCallback, useContext, useState, useMemo, type ReactNode } from 'react';
import type { BuffOverrides } from '../components/BuffToggles.js';
import { CGS_DEFAULTS, type CgsValues } from '../utils/cgs.js';
import type { KbConfig } from '../hooks/useSimulation.js';
import type { ProposalChange } from '@engine/proposals/types.js';

interface EditMeta {
  name: string;
  author: string;
}

const EMPTY_EDIT_META: EditMeta = { name: '', author: '' };

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
  editEnabled: boolean;
  setEditEnabled: (enabled: boolean) => void;
  editChanges: ProposalChange[];
  addEditChange: (change: ProposalChange) => void;
  removeEditChange: (index: number) => void;
  updateEditChange: (index: number, change: ProposalChange) => void;
  clearEditChanges: () => void;
  editMeta: EditMeta;
  setEditMeta: (meta: EditMeta) => void;
  loadEditState: (changes: ProposalChange[], meta?: EditMeta) => void;
  breakdownEnabled: boolean;
  setBreakdownEnabled: (enabled: boolean) => void;
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
  const [editEnabled, setEditEnabledRaw] = useState(false);
  const [editChanges, setEditChanges] = useState<ProposalChange[]>([]);
  const [editMeta, setEditMetaRaw] = useState<EditMeta>(EMPTY_EDIT_META);
  const [breakdownEnabled, setBreakdownEnabled] = useState(false);

  const setEditEnabled = useCallback((enabled: boolean) => {
    setEditEnabledRaw(enabled);
    if (!enabled) {
      setEditChanges([]);
      setEditMetaRaw(EMPTY_EDIT_META);
    }
  }, []);

  const addEditChange = useCallback((change: ProposalChange) => {
    setEditChanges((prev) => [...prev, change]);
  }, []);

  const removeEditChange = useCallback((index: number) => {
    setEditChanges((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateEditChange = useCallback((index: number, change: ProposalChange) => {
    setEditChanges((prev) => prev.map((c, i) => (i === index ? change : c)));
  }, []);

  const clearEditChanges = useCallback(() => {
    setEditChanges([]);
  }, []);

  const setEditMeta = useCallback((meta: EditMeta) => {
    setEditMetaRaw(meta);
  }, []);

  const loadEditState = useCallback((changes: ProposalChange[], meta?: EditMeta) => {
    setEditEnabledRaw(true);
    setEditChanges(changes);
    setEditMetaRaw(meta ?? EMPTY_EDIT_META);
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
      editEnabled,
      setEditEnabled,
      editChanges,
      addEditChange,
      removeEditChange,
      updateEditChange,
      clearEditChanges,
      editMeta,
      setEditMeta,
      loadEditState,
      breakdownEnabled,
      setBreakdownEnabled,
    }),
    [targetCount, elementModifiers, buffOverrides, kbEnabled, bossAttackInterval, bossAccuracy, capEnabled, selectedTier, cgsValues, kbConfig, efficiencyOverrides, editEnabled, editChanges, editMeta, setEditEnabled, addEditChange, removeEditChange, updateEditChange, clearEditChanges, setEditMeta, loadEditState, breakdownEnabled],
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
