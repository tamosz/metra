import type { ScenarioResult } from '../proposals/types.js';
import type { BalanceAudit, GroupSummary, OutlierEntry, TierSensitivity } from './types.js';
import { TIER_ORDER } from '../data/types.js';

const OUTLIER_THRESHOLD = 1.5;

/**
 * Analyze simulation results for balance outliers.
 *
 * Groups results by (scenario, tier), computes stats, flags skills
 * that deviate >1.5σ from the group mean, and identifies skills
 * with unusual tier scaling.
 */
export function analyzeBalance(results: ScenarioResult[]): BalanceAudit {
  const grouped = groupByScenarioTier(results);
  const groups: GroupSummary[] = [];
  const outliers: OutlierEntry[] = [];

  for (const [key, entries] of grouped) {
    const [scenario, tier] = key.split('\0');
    const dpsValues = entries.map((r) => r.dps.dps);
    const summary = computeGroupSummary(scenario, tier, dpsValues);
    groups.push(summary);

    if (summary.stdDev === 0) continue;

    for (const entry of entries) {
      const deviations = (entry.dps.dps - summary.mean) / summary.stdDev;
      if (Math.abs(deviations) > OUTLIER_THRESHOLD) {
        outliers.push({
          className: entry.className,
          skillName: entry.skillName,
          scenario,
          tier,
          dps: entry.dps.dps,
          deviations,
          direction: deviations > 0 ? 'over' : 'under',
        });
      }
    }
  }

  // Sort outliers by absolute deviation descending
  outliers.sort((a, b) => Math.abs(b.deviations) - Math.abs(a.deviations));

  const tierSensitivities = computeTierSensitivities(results);

  return { groups, outliers, tierSensitivities };
}

/** Group results by (scenario, tier) using null-byte separated composite keys. */
function groupByScenarioTier(results: ScenarioResult[]): Map<string, ScenarioResult[]> {
  const map = new Map<string, ScenarioResult[]>();
  for (const r of results) {
    const key = `${r.scenario}\0${r.tier}`;
    const list = map.get(key);
    if (list) {
      list.push(r);
    } else {
      map.set(key, [r]);
    }
  }
  return map;
}

function computeGroupSummary(scenario: string, tier: string, values: number[]): GroupSummary {
  const count = values.length;
  const mean = values.reduce((s, v) => s + v, 0) / count;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / count;
  const stdDev = Math.sqrt(variance);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = min > 0 ? max / min : Infinity;

  return { scenario, tier, mean, stdDev, min, max, spread, count };
}

function computeTierSensitivities(results: ScenarioResult[]): TierSensitivity[] {
  const topTier = TIER_ORDER[TIER_ORDER.length - 1];
  const bottomTier = TIER_ORDER[0];

  // Group by (className, skillName, scenario) using null-byte separated composite keys
  const map = new Map<string, { high?: number; low?: number }>();
  for (const r of results) {
    const key = `${r.className}\0${r.skillName}\0${r.scenario}`;
    const entry = map.get(key) ?? {};
    if (r.tier === topTier) entry.high = r.dps.dps;
    if (r.tier === bottomTier) entry.low = r.dps.dps;
    map.set(key, entry);
  }

  // Compute ratios for entries that have both tiers
  const entries: { className: string; skillName: string; scenario: string; highDps: number; lowDps: number; ratio: number }[] = [];
  for (const [key, { high, low }] of map) {
    if (high == null || low == null || low === 0) continue;
    const [className, skillName, scenario] = key.split('\0');
    entries.push({ className, skillName, scenario, highDps: high, lowDps: low, ratio: high / low });
  }

  if (entries.length === 0) return [];

  // Group by scenario to compute per-scenario median
  const byScenario = new Map<string, typeof entries>();
  for (const e of entries) {
    const list = byScenario.get(e.scenario);
    if (list) list.push(e);
    else byScenario.set(e.scenario, [e]);
  }

  const sensitivities: TierSensitivity[] = [];

  for (const [scenario, scenarioEntries] of byScenario) {
    const ratios = scenarioEntries.map((e) => e.ratio).sort((a, b) => a - b);
    const medianRatio = median(ratios);

    // Compute std dev of ratios
    const meanRatio = ratios.reduce((s, v) => s + v, 0) / ratios.length;
    const ratioVariance = ratios.reduce((s, v) => s + (v - meanRatio) ** 2, 0) / ratios.length;
    const ratioStdDev = Math.sqrt(ratioVariance);

    if (ratioStdDev === 0) continue;

    for (const entry of scenarioEntries) {
      const deviation = entry.ratio - medianRatio;
      const deviationsFromMean = (entry.ratio - meanRatio) / ratioStdDev;
      if (Math.abs(deviationsFromMean) > OUTLIER_THRESHOLD) {
        sensitivities.push({
          className: entry.className,
          skillName: entry.skillName,
          scenario,
          highDps: entry.highDps,
          lowDps: entry.lowDps,
          ratio: entry.ratio,
          medianRatio,
          deviation,
        });
      }
    }
  }

  // Sort by absolute deviation descending
  sensitivities.sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation));

  return sensitivities;
}

function median(sorted: number[]): number {
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid];
  return (sorted[mid - 1] + sorted[mid]) / 2;
}
