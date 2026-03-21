import { createContext, useCallback, useContext, useState, useMemo, type ReactNode } from 'react';
import type { ProposalChange } from '@engine/proposals/types.js';

export interface EditMeta {
  name: string;
  author: string;
}

const EMPTY_EDIT_META: EditMeta = { name: '', author: '' };

export interface ProposalEditContextType {
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
  resetEdit: () => void;
}

const ProposalEditContext = createContext<ProposalEditContextType | null>(null);

export function ProposalEditProvider({ children }: { children: ReactNode }) {
  const [editEnabled, setEditEnabledRaw] = useState(false);
  const [editChanges, setEditChanges] = useState<ProposalChange[]>([]);
  const [editMeta, setEditMetaRaw] = useState<EditMeta>(EMPTY_EDIT_META);

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

  const resetEdit = useCallback(() => {
    setEditEnabledRaw(false);
    setEditChanges([]);
    setEditMetaRaw(EMPTY_EDIT_META);
  }, []);

  const value = useMemo(
    () => ({
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
      resetEdit,
    }),
    [editEnabled, editChanges, editMeta, setEditEnabled, addEditChange, removeEditChange, updateEditChange, clearEditChanges, setEditMeta, loadEditState, resetEdit],
  );

  return (
    <ProposalEditContext.Provider value={value}>
      {children}
    </ProposalEditContext.Provider>
  );
}

export function useProposalEdit(): ProposalEditContextType {
  const context = useContext(ProposalEditContext);
  if (!context) {
    throw new Error('useProposalEdit must be used within a ProposalEditProvider');
  }
  return context;
}
