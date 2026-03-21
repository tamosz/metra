import { useState, useEffect, useRef } from 'react';
import { compareProposal } from '@engine/proposals/compare.js';
import type { SimulationConfig } from '@engine/proposals/simulate.js';
import type { ComparisonResult, ProposalChange } from '@engine/proposals/types.js';

import {
  discoveredData,
  weaponData,
  attackSpeedData,
  mwData,
} from '../data/bundle.js';
import type { BuffOverrides } from '../components/BuffToggles.js';
import { buildScenarios } from '../utils/scenario-builder.js';
import type { KbConfig } from './useSimulation.js';

export interface EditComparisonOptions {
  changes: ProposalChange[];
  targetCount?: number;
  elementModifiers?: Record<string, number>;
  buffOverrides?: BuffOverrides;
  kbConfig?: KbConfig;
  efficiencyOverrides?: Record<string, number[]>;
}

export interface EditComparisonData {
  result: ComparisonResult | null;
  error: Error | null;
}

const DEBOUNCE_MS = 80;

function runComparison(
  changes: ProposalChange[],
  options: Omit<EditComparisonOptions, 'changes'>,
): { result: ComparisonResult | null; error: Error | null } {
  if (changes.length === 0) {
    return { result: null, error: null };
  }

  const { classNames, classDataMap, builds } = discoveredData;

  try {
    const scenarios = buildScenarios(options);
    const config: SimulationConfig = { classes: classNames, scenarios };
    const proposal = { name: '', author: '', changes };

    const result = compareProposal(
      proposal,
      config,
      classDataMap,
      builds,
      weaponData,
      attackSpeedData,
      mwData,
    );

    return { result, error: null };
  } catch (e) {
    return { result: null, error: e instanceof Error ? e : new Error(String(e)) };
  }
}

export function useEditComparison(options: EditComparisonOptions): EditComparisonData {
  const { changes, targetCount, elementModifiers, buffOverrides, kbConfig, efficiencyOverrides } = options;

  // Run synchronously on first call with changes (no flash of empty state),
  // then debounce subsequent updates to avoid jank from rapid edits.
  const hasRun = useRef(false);
  const [state, setState] = useState<EditComparisonData>(() => {
    if (changes.length > 0) {
      hasRun.current = true;
      return runComparison(changes, { targetCount, elementModifiers, buffOverrides, kbConfig, efficiencyOverrides });
    }
    return { result: null, error: null };
  });

  useEffect(() => {
    // Skip the first render if we already computed in useState initializer
    if (!hasRun.current && changes.length === 0) return;
    if (hasRun.current) {
      hasRun.current = false;
      return;
    }

    if (changes.length === 0) {
      setState({ result: null, error: null });
      return;
    }

    const timer = setTimeout(() => {
      setState(runComparison(changes, { targetCount, elementModifiers, buffOverrides, kbConfig, efficiencyOverrides }));
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [changes, targetCount, elementModifiers, buffOverrides, kbConfig, efficiencyOverrides]);

  return state;
}
