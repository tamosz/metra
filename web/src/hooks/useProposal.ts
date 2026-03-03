import { useState, useMemo, useCallback } from 'react';
import { compareProposal } from '@engine/proposals/compare.js';
import type { SimulationConfig } from '@engine/proposals/simulate.js';
import type { Proposal, ProposalChange, ComparisonResult, ScenarioConfig } from '@engine/proposals/types.js';

import {
  discoveredData,
  weaponData,
  attackSpeedData,
  mwData,
} from '../data/bundle.js';

export interface ProposalState {
  proposal: Proposal;
  result: ComparisonResult | null;
  simulating: boolean;
  error: Error | null;
  setName: (name: string) => void;
  setAuthor: (author: string) => void;
  setDescription: (description: string) => void;
  addChange: (change: ProposalChange) => void;
  removeChange: (index: number) => void;
  updateChange: (index: number, change: ProposalChange) => void;
  simulate: (proposalOverride?: Proposal) => void;
  loadProposal: (proposal: Proposal) => void;
  clearResult: () => void;
}

export function useProposal(targetCount?: number): ProposalState {
  const [proposal, setProposal] = useState<Proposal>({
    name: '',
    author: '',
    description: '',
    changes: [],
  });
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const setName = useCallback((name: string) => {
    setProposal((p) => ({ ...p, name }));
    setResult(null);
  }, []);

  const setAuthor = useCallback((author: string) => {
    setProposal((p) => ({ ...p, author }));
  }, []);

  const setDescription = useCallback((description: string) => {
    setProposal((p) => ({ ...p, description }));
  }, []);

  const addChange = useCallback((change: ProposalChange) => {
    setProposal((p) => ({ ...p, changes: [...p.changes, change] }));
    setResult(null);
  }, []);

  const removeChange = useCallback((index: number) => {
    setProposal((p) => ({
      ...p,
      changes: p.changes.filter((_, i) => i !== index),
    }));
    setResult(null);
  }, []);

  const updateChange = useCallback((index: number, change: ProposalChange) => {
    setProposal((p) => ({
      ...p,
      changes: p.changes.map((c, i) => (i === index ? change : c)),
    }));
    setResult(null);
  }, []);

  const simulate = useCallback((proposalOverride?: Proposal) => {
    const p = proposalOverride ?? proposal;
    if (p.changes.length === 0) return;

    setSimulating(true);
    setError(null);
    setTimeout(() => {
      try {
        const { classNames, tiers, classDataMap, gearTemplates } = discoveredData;
        const scenarios: ScenarioConfig[] = [{ name: 'Baseline' }];
        if (targetCount != null && targetCount > 1) {
          scenarios.push({ name: `Training (${targetCount} mobs)`, targetCount });
        }
        const config: SimulationConfig = {
          classes: classNames,
          tiers,
          scenarios,
        };

        const comparisonResult = compareProposal(
          p,
          config,
          classDataMap,
          gearTemplates,
          weaponData,
          attackSpeedData,
          mwData
        );

        setResult(comparisonResult);
      } catch (e) {
        setError(e instanceof Error ? e : new Error(String(e)));
      } finally {
        setSimulating(false);
      }
    }, 0);
  }, [proposal, targetCount]);

  const loadProposal = useCallback((p: Proposal) => {
    setProposal(p);
    setResult(null);
  }, []);

  const clearResult = useCallback(() => {
    setResult(null);
  }, []);

  return {
    proposal,
    result,
    simulating,
    error,
    setName,
    setAuthor,
    setDescription,
    addChange,
    removeChange,
    updateChange,
    simulate,
    loadProposal,
    clearResult,
  };
}
