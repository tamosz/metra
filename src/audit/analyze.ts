import type { ScenarioResult } from '../proposals/types.js';
import { groupResultsByScenario } from '../report/utils.js';
import type { BalanceAudit, GroupSummary, OutlierEntry } from './types.js';

const OUTLIER_THRESHOLD = 1.5;

/**
 * Analyze simulation results for balance outliers.
 *
 * Groups results by scenario, computes stats, flags skills
 * that deviate >1.5σ from the group mean.
 */
export function analyzeBalance(results: ScenarioResult[]): BalanceAudit {
  const grouped = groupResultsByScenario(results);
  const groups: GroupSummary[] = [];
  const outliers: OutlierEntry[] = [];

  for (const { scenario, results: entries } of grouped) {
    const dpsValues = entries.map((r) => r.dps.dps);
    const summary = computeGroupSummary(scenario, dpsValues);
    groups.push(summary);

    if (summary.stdDev === 0) continue;

    for (const entry of entries) {
      const deviations = (entry.dps.dps - summary.mean) / summary.stdDev;
      if (Math.abs(deviations) > OUTLIER_THRESHOLD) {
        outliers.push({
          className: entry.className,
          skillName: entry.skillName,
          scenario,
          dps: entry.dps.dps,
          deviations,
          direction: deviations > 0 ? 'over' : 'under',
        });
      }
    }
  }

  // Sort outliers by absolute deviation descending
  outliers.sort((a, b) => Math.abs(b.deviations) - Math.abs(a.deviations));

  return { groups, outliers };
}

function computeGroupSummary(scenario: string, values: number[]): GroupSummary {
  const count = values.length;
  const mean = values.reduce((s, v) => s + v, 0) / count;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / count;
  const stdDev = Math.sqrt(variance);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = min > 0 ? max / min : Infinity;

  return { scenario, mean, stdDev, min, max, spread, count };
}
