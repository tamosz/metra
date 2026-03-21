import { describe, it, expect } from 'vitest';
import { analyzeBalance } from './analyze.js';
import type { ScenarioResult } from '../proposals/types.js';
import type { DpsResult } from '@metra/engine';

function makeDpsResult(dps: number): DpsResult {
  return {
    skillName: 'Test',
    damageRange: { min: 1000, max: 2000, average: 1500 },
    attackTime: 0.6,
    skillDamagePercent: 100,
    critDamagePercent: 0,
    adjustedRangeNormal: 1500,
    adjustedRangeCrit: 0,
    averageDamage: dps,
    dps,
    uncappedDps: dps,
    capLossPercent: 0,
    totalCritRate: 0,
    hitCount: 1,
    hasShadowPartner: false,
  };
}

function makeResult(opts: { className?: string; skillName?: string; scenario?: string; dps: number }): ScenarioResult {
  return {
    className: opts.className ?? 'TestClass',
    skillName: opts.skillName ?? 'TestSkill',
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

  it('returns empty audit for empty input', () => {
    const audit = analyzeBalance([]);
    expect(audit.groups).toHaveLength(0);
    expect(audit.outliers).toHaveLength(0);
  });

  it('does not flag values within 1.5s of the group mean', () => {
    const results = [
      makeResult({ className: 'A', skillName: 'S1', dps: 95000 }),
      makeResult({ className: 'B', skillName: 'S2', dps: 100000 }),
      makeResult({ className: 'C', skillName: 'S3', dps: 105000 }),
      makeResult({ className: 'D', skillName: 'S4', dps: 100000 }),
    ];
    const audit = analyzeBalance(results);
    expect(audit.outliers).toHaveLength(0);
  });

  it('flags extreme value in a large uniform group', () => {
    const results = Array.from({ length: 9 }, (_, i) =>
      makeResult({ className: `C${i}`, skillName: `S${i}`, dps: 100000 })
    );
    results.push(makeResult({ className: 'Outlier', skillName: 'Extreme', dps: 300000 }));
    const audit = analyzeBalance(results);
    const outlier = audit.outliers.find((o) => o.className === 'Outlier');
    expect(outlier).toBeDefined();
    expect(outlier!.direction).toBe('over');
  });

  it('handles spread=Infinity when min DPS is 0', () => {
    const results = [
      makeResult({ className: 'A', skillName: 'S1', dps: 0 }),
      makeResult({ className: 'B', skillName: 'S2', dps: 100000 }),
    ];
    const audit = analyzeBalance(results);
    expect(audit.groups[0].spread).toBe(Infinity);
  });

  it('handles multiple scenarios independently', () => {
    const results = [
      makeResult({ className: 'A', skillName: 'S1', scenario: 'Buffed', dps: 100000 }),
      makeResult({ className: 'B', skillName: 'S2', scenario: 'Buffed', dps: 100000 }),
      makeResult({ className: 'A', skillName: 'S1', scenario: 'Scenario B', dps: 50000 }),
      makeResult({ className: 'B', skillName: 'S2', scenario: 'Scenario B', dps: 50000 }),
      makeResult({ className: 'C', skillName: 'S3', scenario: 'Scenario B', dps: 50000 }),
      makeResult({ className: 'D', skillName: 'S4', scenario: 'Scenario B', dps: 50000 }),
      makeResult({ className: 'E', skillName: 'S5', scenario: 'Scenario B', dps: 150000 }),
    ];
    const audit = analyzeBalance(results);
    const buffedGroups = audit.groups.filter((g) => g.scenario === 'Buffed');
    const scenarioBGroups = audit.groups.filter((g) => g.scenario === 'Scenario B');
    expect(buffedGroups).toHaveLength(1);
    expect(scenarioBGroups).toHaveLength(1);
    const buffedOutliers = audit.outliers.filter((o) => o.scenario === 'Buffed');
    const scenarioBOutliers = audit.outliers.filter((o) => o.scenario === 'Scenario B');
    expect(buffedOutliers).toHaveLength(0);
    expect(scenarioBOutliers.length).toBeGreaterThanOrEqual(1);
  });

  it('handles two entries in a group (pair)', () => {
    const results = [
      makeResult({ className: 'A', skillName: 'S1', dps: 100000 }),
      makeResult({ className: 'B', skillName: 'S2', dps: 200000 }),
    ];
    const audit = analyzeBalance(results);
    expect(audit.groups[0].count).toBe(2);
    expect(audit.outliers).toHaveLength(0);
  });

  it('produces no false outliers in a very tight cluster', () => {
    const results = [
      makeResult({ className: 'A', skillName: 'S1', dps: 100000 }),
      makeResult({ className: 'B', skillName: 'S2', dps: 100001 }),
      makeResult({ className: 'C', skillName: 'S3', dps: 100002 }),
    ];
    const audit = analyzeBalance(results);
    expect(audit.outliers).toHaveLength(0);
    expect(audit.groups[0].stdDev).toBeLessThan(1);
  });

  it('flags symmetric outliers on both sides', () => {
    const results = [
      makeResult({ className: 'A', skillName: 'S1', dps: 100000 }),
      makeResult({ className: 'B', skillName: 'S2', dps: 100000 }),
      makeResult({ className: 'C', skillName: 'S3', dps: 100000 }),
      makeResult({ className: 'D', skillName: 'S4', dps: 100000 }),
      makeResult({ className: 'Low', skillName: 'Weak', dps: 30000 }),
      makeResult({ className: 'High', skillName: 'Strong', dps: 170000 }),
    ];
    const audit = analyzeBalance(results);
    const lowOutlier = audit.outliers.find((o) => o.className === 'Low');
    const highOutlier = audit.outliers.find((o) => o.className === 'High');
    expect(lowOutlier).toBeDefined();
    expect(lowOutlier!.direction).toBe('under');
    expect(highOutlier).toBeDefined();
    expect(highOutlier!.direction).toBe('over');
  });
});
