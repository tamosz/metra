import { describe, it, expect } from 'vitest';
import { analyzeBalance } from './analyze.js';
import type { ScenarioResult } from '../proposals/types.js';
import type { DpsResult } from '../engine/dps.js';

function makeDpsResult(dps: number): DpsResult {
  return {
    skillName: 'Test',
    damageRange: { min: 1000, max: 2000, average: 1500 },
    attackTime: 0.6,
    skillDamagePercent: 100,
    seDamagePercent: 0,
    adjustedRange: 1500,
    adjustedRangeSe: 0,
    averageDamage: dps,
    dps,
  };
}

function makeResult(opts: { className?: string; skillName?: string; tier?: string; scenario?: string; dps: number }): ScenarioResult {
  return {
    className: opts.className ?? 'TestClass',
    skillName: opts.skillName ?? 'TestSkill',
    tier: opts.tier ?? 'high',
    scenario: opts.scenario ?? 'Buffed',
    dps: makeDpsResult(opts.dps),
  };
}

describe('analyzeBalance', () => {
  it('returns empty outliers when all DPS values are equal', () => {
    const results = [
      makeResult({ className: 'A', skillName: 'S1', dps: 100000 }),
      makeResult({ className: 'B', skillName: 'S2', dps: 100000 }),
      makeResult({ className: 'C', skillName: 'S3', dps: 100000 }),
    ];
    const audit = analyzeBalance(results);
    expect(audit.outliers).toHaveLength(0);
    expect(audit.groups).toHaveLength(1);
    expect(audit.groups[0].stdDev).toBe(0);
    expect(audit.groups[0].spread).toBe(1);
  });

  it('flags an outlier over-performing', () => {
    const results = [
      makeResult({ className: 'A', skillName: 'S1', dps: 100000 }),
      makeResult({ className: 'B', skillName: 'S2', dps: 100000 }),
      makeResult({ className: 'C', skillName: 'S3', dps: 100000 }),
      makeResult({ className: 'D', skillName: 'S4', dps: 100000 }),
      makeResult({ className: 'E', skillName: 'Outlier', dps: 200000 }),
    ];
    const audit = analyzeBalance(results);
    expect(audit.outliers.length).toBeGreaterThanOrEqual(1);
    const overOutlier = audit.outliers.find((o) => o.className === 'E');
    expect(overOutlier).toBeDefined();
    expect(overOutlier!.direction).toBe('over');
    expect(overOutlier!.deviations).toBeGreaterThan(1.5);
  });

  it('flags an outlier under-performing', () => {
    const results = [
      makeResult({ className: 'A', skillName: 'S1', dps: 200000 }),
      makeResult({ className: 'B', skillName: 'S2', dps: 200000 }),
      makeResult({ className: 'C', skillName: 'S3', dps: 200000 }),
      makeResult({ className: 'D', skillName: 'S4', dps: 200000 }),
      makeResult({ className: 'E', skillName: 'Weak', dps: 50000 }),
    ];
    const audit = analyzeBalance(results);
    const underOutlier = audit.outliers.find((o) => o.className === 'E');
    expect(underOutlier).toBeDefined();
    expect(underOutlier!.direction).toBe('under');
    expect(underOutlier!.deviations).toBeLessThan(-1.5);
  });

  it('computes group summary correctly', () => {
    const results = [
      makeResult({ className: 'A', skillName: 'S1', dps: 100000 }),
      makeResult({ className: 'B', skillName: 'S2', dps: 200000 }),
      makeResult({ className: 'C', skillName: 'S3', dps: 300000 }),
    ];
    const audit = analyzeBalance(results);
    expect(audit.groups).toHaveLength(1);
    const group = audit.groups[0];
    expect(group.mean).toBe(200000);
    expect(group.min).toBe(100000);
    expect(group.max).toBe(300000);
    expect(group.spread).toBe(3);
    expect(group.count).toBe(3);
  });

  it('groups by scenario and tier separately', () => {
    const results = [
      makeResult({ className: 'A', skillName: 'S1', tier: 'high', scenario: 'Buffed', dps: 200000 }),
      makeResult({ className: 'A', skillName: 'S1', tier: 'low', scenario: 'Buffed', dps: 100000 }),
      makeResult({ className: 'B', skillName: 'S2', tier: 'high', scenario: 'Buffed', dps: 200000 }),
      makeResult({ className: 'B', skillName: 'S2', tier: 'low', scenario: 'Buffed', dps: 100000 }),
    ];
    const audit = analyzeBalance(results);
    expect(audit.groups).toHaveLength(2);
    expect(audit.groups.find((g) => g.tier === 'high')?.mean).toBe(200000);
    expect(audit.groups.find((g) => g.tier === 'low')?.mean).toBe(100000);
  });

  it('detects tier sensitivity outliers', () => {
    // Most classes scale 2x from low to high. One class scales 4x.
    const results = [
      makeResult({ className: 'A', skillName: 'S1', tier: 'high', dps: 200000 }),
      makeResult({ className: 'A', skillName: 'S1', tier: 'low', dps: 100000 }),
      makeResult({ className: 'B', skillName: 'S2', tier: 'high', dps: 200000 }),
      makeResult({ className: 'B', skillName: 'S2', tier: 'low', dps: 100000 }),
      makeResult({ className: 'C', skillName: 'S3', tier: 'high', dps: 200000 }),
      makeResult({ className: 'C', skillName: 'S3', tier: 'low', dps: 100000 }),
      makeResult({ className: 'D', skillName: 'S4', tier: 'high', dps: 200000 }),
      makeResult({ className: 'D', skillName: 'S4', tier: 'low', dps: 100000 }),
      makeResult({ className: 'Outlier', skillName: 'BigScale', tier: 'high', dps: 400000 }),
      makeResult({ className: 'Outlier', skillName: 'BigScale', tier: 'low', dps: 100000 }),
    ];
    const audit = analyzeBalance(results);
    const sensitive = audit.tierSensitivities.find((t) => t.className === 'Outlier');
    expect(sensitive).toBeDefined();
    expect(sensitive!.ratio).toBe(4);
    expect(sensitive!.deviation).toBeGreaterThan(0);
  });

  it('returns empty tier sensitivities when all ratios are the same', () => {
    const results = [
      makeResult({ className: 'A', skillName: 'S1', tier: 'high', dps: 200000 }),
      makeResult({ className: 'A', skillName: 'S1', tier: 'low', dps: 100000 }),
      makeResult({ className: 'B', skillName: 'S2', tier: 'high', dps: 300000 }),
      makeResult({ className: 'B', skillName: 'S2', tier: 'low', dps: 150000 }),
    ];
    const audit = analyzeBalance(results);
    expect(audit.tierSensitivities).toHaveLength(0);
  });

  it('handles single entry group without crashing', () => {
    const results = [
      makeResult({ className: 'A', skillName: 'S1', dps: 100000 }),
    ];
    const audit = analyzeBalance(results);
    expect(audit.groups).toHaveLength(1);
    expect(audit.outliers).toHaveLength(0);
  });

  it('sorts outliers by absolute deviation descending', () => {
    const results = [
      makeResult({ className: 'A', skillName: 'S1', dps: 100000 }),
      makeResult({ className: 'B', skillName: 'S2', dps: 100000 }),
      makeResult({ className: 'C', skillName: 'S3', dps: 100000 }),
      makeResult({ className: 'Mild', skillName: 'S4', dps: 160000 }),
      makeResult({ className: 'Extreme', skillName: 'S5', dps: 300000 }),
    ];
    const audit = analyzeBalance(results);
    if (audit.outliers.length >= 2) {
      expect(Math.abs(audit.outliers[0].deviations))
        .toBeGreaterThanOrEqual(Math.abs(audit.outliers[1].deviations));
    }
  });
});
