import type { DeltaEntry, ScenarioResult } from '../proposals/types.js';

/**
 * Format a number with thousands separators (locale-independent).
 */
export function formatNumber(n: number): string {
  const str = Math.round(n).toString();
  const negative = str.startsWith('-');
  const digits = negative ? str.slice(1) : str;
  const withCommas = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return negative ? '-' + withCommas : withCommas;
}

/**
 * Format a change value with +/- prefix.
 */
export function formatChange(n: number): string {
  const prefix = n > 0 ? '+' : '';
  return prefix + formatNumber(n);
}

/**
 * Format a percentage with +/- prefix and one decimal.
 */
export function formatPercent(n: number): string {
  const prefix = n > 0 ? '+' : '';
  return prefix + n.toFixed(1) + '%';
}

export function formatRank(before?: number, after?: number): string {
  if (before == null || after == null) return '-';
  if (before === after) return String(before);
  return `${before}\u2192${after}`;
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Sort deltas: changed entries first (by absolute % desc), then unchanged.
 * Within unchanged group, sort by class then tier.
 */
export function sortDeltas(deltas: DeltaEntry[]): DeltaEntry[] {
  return [...deltas].sort((a, b) => {
    const aChanged = a.change !== 0 ? 0 : 1;
    const bChanged = b.change !== 0 ? 0 : 1;
    if (aChanged !== bChanged) return aChanged - bChanged;
    if (aChanged === 0) {
      return Math.abs(b.changePercent) - Math.abs(a.changePercent);
    }
    const classCompare = a.className.localeCompare(b.className);
    if (classCompare !== 0) return classCompare;
    return a.tier.localeCompare(b.tier);
  });
}

/**
 * Group deltas by scenario name, preserving insertion order.
 */
export function groupDeltasByScenario(
  deltas: DeltaEntry[]
): { scenario: string; deltas: DeltaEntry[] }[] {
  const groups: { scenario: string; deltas: DeltaEntry[] }[] = [];
  const indexMap = new Map<string, number>();

  for (const d of deltas) {
    const scenario = d.scenario ?? 'Buffed';
    if (!indexMap.has(scenario)) {
      indexMap.set(scenario, groups.length);
      groups.push({ scenario, deltas: [] });
    }
    groups[indexMap.get(scenario)!].deltas.push(d);
  }

  return groups;
}

/**
 * Group scenario results by scenario name, preserving insertion order.
 */
export function groupResultsByScenario(
  results: ScenarioResult[]
): { scenario: string; results: ScenarioResult[] }[] {
  const groups: { scenario: string; results: ScenarioResult[] }[] = [];
  const indexMap = new Map<string, number>();

  for (const r of results) {
    if (!indexMap.has(r.scenario)) {
      indexMap.set(r.scenario, groups.length);
      groups.push({ scenario: r.scenario, results: [] });
    }
    groups[indexMap.get(r.scenario)!].results.push(r);
  }

  return groups;
}
