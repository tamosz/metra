import { useMemo, useCallback } from 'react';
import { useBuildExplorer, type BuildExplorerState, type BuildOverrides } from './useBuildExplorer.js';

export interface ComparisonResult {
  bestA: { skillName: string; dps: number } | null;
  bestB: { skillName: string; dps: number } | null;
  deltaPercent: number; // positive = B wins
  sameClass: boolean;
}

export interface BuildComparisonState {
  buildA: BuildExplorerState;
  buildB: BuildExplorerState;
  comparison: ComparisonResult;
  loadFromUrl: (
    a: { class: string; tier: string; overrides: Partial<BuildOverrides> },
    b: { class: string; tier: string; overrides: Partial<BuildOverrides> },
  ) => void;
}

function getBestSkill(results: { skillName: string; dps: number }[]): { skillName: string; dps: number } | null {
  if (results.length === 0) return null;
  return results.reduce((best, r) => (r.dps > best.dps ? r : best));
}

export function useBuildComparison(): BuildComparisonState {
  const buildA = useBuildExplorer();
  const buildB = useBuildExplorer();

  const comparison = useMemo((): ComparisonResult => {
    const bestA = getBestSkill(buildA.results);
    const bestB = getBestSkill(buildB.results);
    let deltaPercent = 0;
    if (bestA && bestB && bestA.dps > 0) {
      deltaPercent = ((bestB.dps - bestA.dps) / bestA.dps) * 100;
    }
    const sameClass = buildA.selectedClass === buildB.selectedClass;
    return { bestA, bestB, deltaPercent, sameClass };
  }, [buildA.results, buildB.results, buildA.selectedClass, buildB.selectedClass]);

  const { loadFromUrl: loadA } = buildA;
  const { loadFromUrl: loadB } = buildB;
  const loadFromUrl = useCallback(
    (
      a: { class: string; tier: string; overrides: Partial<BuildOverrides> },
      b: { class: string; tier: string; overrides: Partial<BuildOverrides> },
    ) => {
      loadA(a.class, a.tier, a.overrides);
      loadB(b.class, b.tier, b.overrides);
    },
    [loadA, loadB],
  );

  return { buildA, buildB, comparison, loadFromUrl };
}
