import { useMemo, useState, useEffect, useRef } from 'react';
import { compareProposal } from '@engine/proposals/compare.js';
import type { SimulationConfig } from '@engine/proposals/simulate.js';
import type { ScenarioConfig, ComparisonResult, ProposalChange } from '@engine/proposals/types.js';

import {
  discoveredData,
  weaponData,
  attackSpeedData,
  mwData,
} from '../data/bundle.js';
import type { BuffOverrides } from '../components/BuffToggles.js';
import { applyCgsOverride, type CgsValues } from '../utils/cgs.js';
import type { KbConfig } from './useSimulation.js';

export interface WhatIfComparisonOptions {
  changes: ProposalChange[];
  targetCount?: number;
  elementModifiers?: Record<string, number>;
  buffOverrides?: BuffOverrides;
  kbConfig?: KbConfig;
  cgsOverride?: { tier: string; values: CgsValues };
  efficiencyOverrides?: Record<string, number[]>;
}

export interface WhatIfComparisonData {
  result: ComparisonResult | null;
  error: Error | null;
}

const DEBOUNCE_MS = 80;

function runComparison(
  changes: ProposalChange[],
  targetCount: number | undefined,
  elementModifiers: Record<string, number> | undefined,
  buffOverrides: BuffOverrides | undefined,
  kbConfig: KbConfig | undefined,
  cgsOverride: { tier: string; values: CgsValues } | undefined,
  efficiencyOverrides: Record<string, number[]> | undefined,
): { result: ComparisonResult | null; error: Error | null } {
  if (changes.length === 0) {
    return { result: null, error: null };
  }

  const { classNames, tiers, classDataMap, gearTemplates } = discoveredData;

  try {
    let finalTemplates = new Map(gearTemplates);
    if (cgsOverride) {
      finalTemplates = applyCgsOverride(
        finalTemplates,
        classDataMap,
        classNames,
        cgsOverride.tier,
        cgsOverride.values,
      );
    }

    const hasElementMods = elementModifiers && Object.keys(elementModifiers).length > 0;
    const hasBuffOverrides = buffOverrides && Object.keys(buffOverrides).length > 0;
    const hasEfficiencyOverrides = efficiencyOverrides && Object.keys(efficiencyOverrides).length > 0;

    const scenario: ScenarioConfig = { name: 'Baseline' };
    if (hasElementMods) scenario.elementModifiers = { ...elementModifiers };
    if (hasBuffOverrides) scenario.overrides = { ...buffOverrides };
    if (kbConfig) {
      scenario.bossAttackInterval = kbConfig.bossAttackInterval;
      scenario.bossAccuracy = kbConfig.bossAccuracy;
    }
    if (hasEfficiencyOverrides) scenario.efficiencyOverrides = { ...efficiencyOverrides };
    const scenarios: ScenarioConfig[] = [scenario];
    if (targetCount != null && targetCount > 1) {
      const training: ScenarioConfig = { name: `Training (${targetCount} mobs)`, targetCount };
      if (hasElementMods) training.elementModifiers = { ...elementModifiers };
      if (hasBuffOverrides) training.overrides = { ...buffOverrides };
      if (kbConfig) {
        training.bossAttackInterval = kbConfig.bossAttackInterval;
        training.bossAccuracy = kbConfig.bossAccuracy;
      }
      if (hasEfficiencyOverrides) training.efficiencyOverrides = { ...efficiencyOverrides };
      scenarios.push(training);
    }

    const config: SimulationConfig = { classes: classNames, tiers, scenarios };
    const proposal = { name: '', author: '', changes };

    const result = compareProposal(
      proposal,
      config,
      classDataMap,
      finalTemplates,
      weaponData,
      attackSpeedData,
      mwData,
    );

    return { result, error: null };
  } catch (e) {
    return { result: null, error: e instanceof Error ? e : new Error(String(e)) };
  }
}

export function useWhatIfComparison(options: WhatIfComparisonOptions): WhatIfComparisonData {
  const { changes, targetCount, elementModifiers, buffOverrides, kbConfig, cgsOverride, efficiencyOverrides } = options;

  // Run synchronously on first call with changes (no flash of empty state),
  // then debounce subsequent updates to avoid jank from rapid edits.
  const hasRun = useRef(false);
  const [state, setState] = useState<WhatIfComparisonData>(() => {
    if (changes.length > 0) {
      hasRun.current = true;
      return runComparison(changes, targetCount, elementModifiers, buffOverrides, kbConfig, cgsOverride, efficiencyOverrides);
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
      setState(runComparison(changes, targetCount, elementModifiers, buffOverrides, kbConfig, cgsOverride, efficiencyOverrides));
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [changes, targetCount, elementModifiers, buffOverrides, kbConfig, cgsOverride, efficiencyOverrides]);

  return state;
}
