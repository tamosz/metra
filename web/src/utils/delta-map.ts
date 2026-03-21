import type { DeltaEntry, ComparisonResult } from '@engine/proposals/types.js';

/** Build a lookup map from comparison deltas, keyed by className\0skillName\0scenario. */
export function buildDeltaMap(comparison: ComparisonResult | null | undefined): Map<string, DeltaEntry> | null {
  if (!comparison) return null;
  const map = new Map<string, DeltaEntry>();
  for (const d of comparison.deltas) {
    map.set(`${d.className}\0${d.skillName}\0${d.scenario}`, d);
  }
  return map;
}

export function deltaMapKey(className: string, skillName: string, scenario: string): string {
  return `${className}\0${skillName}\0${scenario}`;
}
