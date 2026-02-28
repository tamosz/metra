import { describe, it, expect } from 'vitest';
import { renderComparisonReport } from './markdown.js';
import type { ComparisonResult } from '../proposals/types.js';

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
