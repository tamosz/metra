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

const ARROW = '\u2192';

export function formatRank(before?: number, after?: number): string {
  if (before == null || after == null) return '-';
  if (before === after) return String(before);
  return `${before}${ARROW}${after}`;
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Format cap loss percentage. Returns '-' for negligible loss (<0.05%).
 */
export function formatCapLoss(percent: number): string {
  if (percent < 0.05) return '-';
  return percent.toFixed(1) + '%';
}

/**
 * Sort deltas: changed entries first (by absolute % desc), then unchanged.
 * Within unchanged group, sort by class name.
 */
export function sortDeltas(deltas: DeltaEntry[]): DeltaEntry[] {
  return [...deltas].sort((a, b) => {
    const aChanged = a.change !== 0 ? 0 : 1;
    const bChanged = b.change !== 0 ? 0 : 1;
    if (aChanged !== bChanged) return aChanged - bChanged;
    if (aChanged === 0) {
      return Math.abs(b.changePercent) - Math.abs(a.changePercent);
    }
    return a.className.localeCompare(b.className);
  });
}

function groupByScenario<T>(
  items: T[],
  getScenario: (item: T) => string,
): { scenario: string; items: T[] }[] {
  const groups: { scenario: string; items: T[] }[] = [];
  const indexMap = new Map<string, number>();

  for (const item of items) {
    const scenario = getScenario(item);
    if (!indexMap.has(scenario)) {
      indexMap.set(scenario, groups.length);
      groups.push({ scenario, items: [] });
    }
    groups[indexMap.get(scenario)!].items.push(item);
  }

  return groups;
}

/**
 * Group deltas by scenario name, preserving insertion order.
 */
export function groupDeltasByScenario(
  deltas: DeltaEntry[]
): { scenario: string; deltas: DeltaEntry[] }[] {
  return groupByScenario(deltas, (d) => d.scenario ?? 'Buffed')
    .map((g) => ({ scenario: g.scenario, deltas: g.items }));
}

/**
 * Group scenario results by scenario name, preserving insertion order.
 */
export function groupResultsByScenario(
  results: ScenarioResult[]
): { scenario: string; results: ScenarioResult[] }[] {
  return groupByScenario(results, (r) => r.scenario)
    .map((g) => ({ scenario: g.scenario, results: g.items }));
}

/**
 * Sort scenario results by DPS descending.
 */
export function sortByDps(results: ScenarioResult[]): ScenarioResult[] {
  return [...results].sort((a, b) => b.dps.dps - a.dps.dps);
}
