import { describe, it, expect } from 'vitest';
import { formatAuditReport } from './format.js';
import type { BalanceAudit, GroupSummary, OutlierEntry } from './types.js';

describe('formatAuditReport', () => {
  it('renders heading', () => {
    const audit: BalanceAudit = { groups: [makeGroup()], outliers: [] };
    const output = formatAuditReport(audit);
    expect(output.startsWith('# Balance Audit')).toBe(true);
  });

  it('contains all sections', () => {
    const audit: BalanceAudit = { groups: [makeGroup()], outliers: [] };
    const output = formatAuditReport(audit);
    expect(output).toContain('## Outliers');
    expect(output).toContain('## Group Summaries');
  });

  it('shows message when outliers are empty', () => {
    const audit: BalanceAudit = { groups: [makeGroup()], outliers: [] };
    const output = formatAuditReport(audit);
    expect(output).toContain('No outliers detected (threshold: 1.5\u03C3).');
  });

  it('renders outlier table with deviation', () => {
    const outlier = makeOutlier({ deviations: 2.5 });
    const audit: BalanceAudit = { groups: [makeGroup()], outliers: [outlier] };
    const output = formatAuditReport(audit);
    expect(output).toContain('| Class | Skill |');
    expect(output).toContain('Night Lord');
    expect(output).toContain('+2.5\u03C3');
  });

  it('renders under-performing outlier without plus prefix', () => {
    const outlier = makeOutlier({ deviations: -1.8, direction: 'under' });
    const audit: BalanceAudit = { groups: [makeGroup()], outliers: [outlier] };
    const output = formatAuditReport(audit);
    expect(output).toContain('-1.8\u03C3');
    expect(output).not.toContain('+-1.8');
  });

  it('renders infinity spread as unicode symbol', () => {
    const group = makeGroup({ spread: Infinity });
    const audit: BalanceAudit = { groups: [group], outliers: [] };
    const output = formatAuditReport(audit);
    expect(output).toContain('\u221E');
    expect(output).not.toContain('Infinityx');
  });

  it('does not show empty-state messages when data is present', () => {
    const audit: BalanceAudit = {
      groups: [makeGroup()],
      outliers: [makeOutlier()],
    };
    const output = formatAuditReport(audit);
    expect(output).not.toContain('No outliers detected');
  });
});

function makeGroup(overrides: Partial<GroupSummary> = {}): GroupSummary {
  return {
    scenario: 'Buffed', mean: 200000, stdDev: 15000,
    min: 170000, max: 230000, spread: 1.35, count: 5, ...overrides,
  };
}

function makeOutlier(overrides: Partial<OutlierEntry> = {}): OutlierEntry {
  return {
    className: 'Night Lord', skillName: 'Triple Throw',
    scenario: 'Buffed', dps: 350000,
    deviations: 2.5, direction: 'over' as const, ...overrides,
  };
}
