import { describe, it, expect } from 'vitest';
import { renderComparisonReport, renderBaselineReport } from './markdown.js';
import type { ComparisonResult, ScenarioResult } from '../proposals/types.js';
import type { DpsResult } from '../engine/dps.js';

describe('renderComparisonReport', () => {
  it('renders a Markdown table with changes and unchanged rows', () => {
    const result: ComparisonResult = {
      proposal: {
        name: 'Brandish Buff',
        author: 'TestPlayer',
        description: 'Increase Brandish base power',
        changes: [
          { target: 'hero.brandish-sword', field: 'basePower', from: 260, to: 280 },
        ],
      },
      before: [],
      after: [],
      deltas: [
        {
          className: 'Hero',
          skillName: 'Brandish (Sword)',
          tier: 'high',
          scenario: 'Buffed',
          before: 255950,
          after: 274167,
          change: 18217,
          changePercent: 7.117,
        },
        {
          className: 'DrK',
          skillName: 'Spear Crusher',
          tier: 'high',
          scenario: 'Buffed',
          before: 249418,
          after: 249418,
          change: 0,
          changePercent: 0,
        },
      ],
    };

    const report = renderComparisonReport(result);

    expect(report).toContain('# Proposal: Brandish Buff');
    expect(report).toContain('**Author:** TestPlayer');
    expect(report).toContain('**Description:** Increase Brandish base power');
    expect(report).toContain('`hero.brandish-sword.basePower`: **280** (was 260)');
    expect(report).toContain('| Class | Skill | Tier |');
    expect(report).toContain('Hero');
    expect(report).toContain('Brandish (Sword)');
    expect(report).toContain('+18,217');
    expect(report).toContain('+7.1%');
    expect(report).toContain('DrK');
    expect(report).toContain('0.0%');
  });

  it('single scenario uses "DPS Comparison" heading (backward compat)', () => {
    const result: ComparisonResult = {
      proposal: {
        name: 'Test',
        author: 'test',
        changes: [],
      },
      before: [],
      after: [],
      deltas: [
        {
          className: 'Hero',
          skillName: 'Brandish',
          tier: 'high',
          scenario: 'Buffed',
          before: 100000,
          after: 110000,
          change: 10000,
          changePercent: 10,
        },
      ],
    };

    const report = renderComparisonReport(result);

    // Should use the generic heading, not the scenario name
    expect(report).toContain('## DPS Comparison');
    expect(report).not.toContain('## Buffed');
  });

  it('sorts changed entries before unchanged', () => {
    const result: ComparisonResult = {
      proposal: {
        name: 'Test',
        author: 'test',
        changes: [],
      },
      before: [],
      after: [],
      deltas: [
        {
          className: 'DrK',
          skillName: 'Crusher',
          tier: 'high',
          scenario: 'Buffed',
          before: 100000,
          after: 100000,
          change: 0,
          changePercent: 0,
        },
        {
          className: 'Hero',
          skillName: 'Brandish',
          tier: 'high',
          scenario: 'Buffed',
          before: 100000,
          after: 110000,
          change: 10000,
          changePercent: 10,
        },
      ],
    };

    const report = renderComparisonReport(result);
    const heroIndex = report.indexOf('Hero');
    const drkIndex = report.indexOf('DrK');

    // Hero (changed) should appear before DrK (unchanged)
    expect(heroIndex).toBeLessThan(drkIndex);
  });
});

describe('renderComparisonReport with multiple scenarios', () => {
  it('renders separate sections per scenario', () => {
    const result: ComparisonResult = {
      proposal: {
        name: 'Multi-Scenario Test',
        author: 'test',
        changes: [
          { target: 'hero.brandish-sword', field: 'basePower', from: 260, to: 280 },
        ],
      },
      before: [],
      after: [],
      deltas: [
        {
          className: 'Hero',
          skillName: 'Brandish (Sword)',
          tier: 'high',
          scenario: 'Buffed',
          before: 255950,
          after: 274167,
          change: 18217,
          changePercent: 7.117,
        },
        {
          className: 'Hero',
          skillName: 'Brandish (Sword)',
          tier: 'high',
          scenario: 'Unbuffed',
          before: 120000,
          after: 130000,
          change: 10000,
          changePercent: 8.333,
        },
      ],
    };

    const report = renderComparisonReport(result);

    // Should have scenario-named headings, not "DPS Comparison"
    expect(report).toContain('## Buffed');
    expect(report).toContain('## Unbuffed');
    expect(report).not.toContain('## DPS Comparison');

    // Each section should have its own table header
    const tableHeaders = report.match(/\| Class \| Skill \| Tier \|/g);
    expect(tableHeaders).toHaveLength(2);

    // Both DPS values should appear
    expect(report).toContain('+18,217');
    expect(report).toContain('+10,000');
  });

  it('preserves scenario order in output', () => {
    const result: ComparisonResult = {
      proposal: {
        name: 'Order Test',
        author: 'test',
        changes: [],
      },
      before: [],
      after: [],
      deltas: [
        {
          className: 'Hero',
          skillName: 'Brandish',
          tier: 'high',
          scenario: 'Buffed',
          before: 100000,
          after: 100000,
          change: 0,
          changePercent: 0,
        },
        {
          className: 'Hero',
          skillName: 'Brandish',
          tier: 'high',
          scenario: 'Unbuffed',
          before: 50000,
          after: 50000,
          change: 0,
          changePercent: 0,
        },
        {
          className: 'Hero',
          skillName: 'Brandish',
          tier: 'high',
          scenario: 'No-Echo',
          before: 90000,
          after: 90000,
          change: 0,
          changePercent: 0,
        },
      ],
    };

    const report = renderComparisonReport(result);

    const buffedIndex = report.indexOf('## Buffed');
    const unbuffedIndex = report.indexOf('## Unbuffed');
    const noEchoIndex = report.indexOf('## No-Echo');

    expect(buffedIndex).toBeLessThan(unbuffedIndex);
    expect(unbuffedIndex).toBeLessThan(noEchoIndex);
  });
});

function mockDpsResult(dps: number): DpsResult {
  return {
    skillName: 'Test',
    attackTime: 0.63,
    damageRange: { min: 1000, max: 2000, average: 1500 },
    skillDamagePercent: 494,
    critDamagePercent: 600,
    adjustedRangeNormal: 1500,
    adjustedRangeCrit: 1800,
    averageDamage: dps * 0.63,
    dps,
  };
}

describe('renderBaselineReport', () => {
  it('renders a ranked DPS table grouped by scenario', () => {
    const results: ScenarioResult[] = [
      { className: 'Hero', skillName: 'Brandish', tier: 'high', scenario: 'Buffed', dps: mockDpsResult(300000) },
      { className: 'DrK', skillName: 'Crusher', tier: 'high', scenario: 'Buffed', dps: mockDpsResult(250000) },
      { className: 'Paladin', skillName: 'Blast', tier: 'high', scenario: 'Buffed', dps: mockDpsResult(200000) },
    ];

    const report = renderBaselineReport(results);

    expect(report).toContain('# DPS Rankings');
    expect(report).toContain('## Buffed');
    expect(report).toContain('| Rank | Class | Skill | Tier | DPS |');

    // Rank 1 should be Hero (highest DPS)
    expect(report).toContain('| 1 | Hero');
    expect(report).toContain('| 2 | DrK');
    expect(report).toContain('| 3 | Paladin');
  });

  it('sorts by DPS descending within each scenario', () => {
    const results: ScenarioResult[] = [
      { className: 'Paladin', skillName: 'Blast', tier: 'high', scenario: 'Buffed', dps: mockDpsResult(100000) },
      { className: 'Hero', skillName: 'Brandish', tier: 'high', scenario: 'Buffed', dps: mockDpsResult(300000) },
    ];

    const report = renderBaselineReport(results);
    const heroIndex = report.indexOf('Hero');
    const paladinIndex = report.indexOf('Paladin');
    expect(heroIndex).toBeLessThan(paladinIndex);
  });

  it('groups multiple scenarios into separate sections', () => {
    const results: ScenarioResult[] = [
      { className: 'Hero', skillName: 'Brandish', tier: 'high', scenario: 'Buffed', dps: mockDpsResult(300000) },
      { className: 'Hero', skillName: 'Brandish', tier: 'high', scenario: 'Unbuffed', dps: mockDpsResult(150000) },
    ];

    const report = renderBaselineReport(results);

    expect(report).toContain('## Buffed');
    expect(report).toContain('## Unbuffed');
    const tableHeaders = report.match(/\| Rank \| Class \| Skill \| Tier \| DPS \|/g);
    expect(tableHeaders).toHaveLength(2);
  });

  it('formats DPS with thousands separators', () => {
    const results: ScenarioResult[] = [
      { className: 'Hero', skillName: 'Brandish', tier: 'high', scenario: 'Buffed', dps: mockDpsResult(255950) },
    ];

    const report = renderBaselineReport(results);
    expect(report).toContain('255,950');
  });
});

describe('renderBaselineReport content accuracy', () => {
  it('DPS values in table match input data', () => {
    const results: ScenarioResult[] = [
      { className: 'Hero', skillName: 'Brandish', tier: 'high', scenario: 'Buffed', dps: mockDpsResult(274167) },
      { className: 'DrK', skillName: 'Crusher', tier: 'mid', scenario: 'Buffed', dps: mockDpsResult(183042) },
    ];

    const report = renderBaselineReport(results);
    const heroLine = report.split('\n').find((l) => l.includes('Hero'));
    expect(heroLine).toContain('274,167');
    const drkLine = report.split('\n').find((l) => l.includes('DrK'));
    expect(drkLine).toContain('183,042');
    expect(drkLine).toContain('Mid');
  });

  it('multi-tier grouping produces tier labels in table rows', () => {
    const results: ScenarioResult[] = [
      { className: 'Hero', skillName: 'Brandish', tier: 'high', scenario: 'Buffed', dps: mockDpsResult(300000) },
      { className: 'Hero', skillName: 'Brandish', tier: 'low', scenario: 'Buffed', dps: mockDpsResult(100000) },
    ];

    const report = renderBaselineReport(results);
    expect(report).toContain('High');
    expect(report).toContain('Low');
  });
});

describe('renderComparisonReport content accuracy', () => {
  it('negative changes show minus prefix', () => {
    const result: ComparisonResult = {
      proposal: { name: 'Nerf', author: 'test', changes: [] },
      before: [],
      after: [],
      deltas: [
        {
          className: 'Hero',
          skillName: 'Brandish',
          tier: 'high',
          scenario: 'Buffed',
          before: 300000,
          after: 270000,
          change: -30000,
          changePercent: -10,
        },
      ],
    };

    const report = renderComparisonReport(result);
    expect(report).toContain('-30,000');
    expect(report).toContain('-10.0%');
    expect(report).not.toContain('+-');
  });
});

describe('renderComparisonReport with rank columns', () => {
  it('shows rank column when ranks are present', () => {
    const result: ComparisonResult = {
      proposal: { name: 'Test', author: 'test', changes: [] },
      before: [],
      after: [],
      deltas: [
        {
          className: 'Hero',
          skillName: 'Brandish',
          tier: 'high',
          scenario: 'Buffed',
          before: 250000,
          after: 270000,
          change: 20000,
          changePercent: 8,
          rankBefore: 2,
          rankAfter: 1,
        },
        {
          className: 'DrK',
          skillName: 'Crusher',
          tier: 'high',
          scenario: 'Buffed',
          before: 260000,
          after: 260000,
          change: 0,
          changePercent: 0,
          rankBefore: 1,
          rankAfter: 2,
        },
      ],
    };

    const report = renderComparisonReport(result);

    expect(report).toContain('| Rank | Class | Skill | Tier |');
    // Hero moved from rank 2 to 1
    expect(report).toContain('2\u21921');
    // DrK moved from rank 1 to 2
    expect(report).toContain('1\u21922');
  });

  it('shows static rank when position unchanged', () => {
    const result: ComparisonResult = {
      proposal: { name: 'Test', author: 'test', changes: [] },
      before: [],
      after: [],
      deltas: [
        {
          className: 'Hero',
          skillName: 'Brandish',
          tier: 'high',
          scenario: 'Buffed',
          before: 250000,
          after: 250000,
          change: 0,
          changePercent: 0,
          rankBefore: 1,
          rankAfter: 1,
        },
      ],
    };

    const report = renderComparisonReport(result);
    // Should show just "1" without arrow
    expect(report).toMatch(/\| 1 \|/);
    expect(report).not.toContain('\u2192');
  });

  it('omits rank column when no ranks present', () => {
    const result: ComparisonResult = {
      proposal: { name: 'Test', author: 'test', changes: [] },
      before: [],
      after: [],
      deltas: [
        {
          className: 'Hero',
          skillName: 'Brandish',
          tier: 'high',
          scenario: 'Buffed',
          before: 250000,
          after: 260000,
          change: 10000,
          changePercent: 4,
        },
      ],
    };

    const report = renderComparisonReport(result);
    expect(report).not.toContain('| Rank |');
  });
});
