import { describe, it, expect } from 'vitest';
import { formatAuditReport } from './format.js';
import type { BalanceAudit, GroupSummary, OutlierEntry, TierSensitivity } from './types.js';

describe('formatAuditReport', () => {
  it('renders heading', () => {
    const audit: BalanceAudit = { groups: [makeGroup()], outliers: [], tierSensitivities: [] };
    const output = formatAuditReport(audit);
    expect(output.startsWith('# Balance Audit')).toBe(true);
  });

  it('contains all sections', () => {
    const audit: BalanceAudit = { groups: [makeGroup()], outliers: [], tierSensitivities: [] };
    const output = formatAuditReport(audit);
    expect(output).toContain('## Outliers');
    expect(output).toContain('## Tier Sensitivity');
    expect(output).toContain('## Group Summaries');
  });

  it('shows message when outliers are empty', () => {
    const audit: BalanceAudit = { groups: [makeGroup()], outliers: [], tierSensitivities: [] };
    const output = formatAuditReport(audit);
    expect(output).toContain('No outliers detected (threshold: 1.5\u03C3).');
  });

  it('renders outlier table with deviation', () => {
    const outlier = makeOutlier({ deviations: 2.5 });
    const audit: BalanceAudit = { groups: [makeGroup()], outliers: [outlier], tierSensitivities: [] };
    const output = formatAuditReport(audit);
    expect(output).toContain('| Class | Skill |');
    expect(output).toContain('NL');
    expect(output).toContain('+2.5\u03C3');
  });

  it('renders under-performing outlier without plus prefix', () => {
    const outlier = makeOutlier({ deviations: -1.8, direction: 'under' });
    const audit: BalanceAudit = { groups: [makeGroup()], outliers: [outlier], tierSensitivities: [] };
    const output = formatAuditReport(audit);
    expect(output).toContain('-1.8\u03C3');
    expect(output).not.toContain('+-1.8');
  });

  it('shows message when tier sensitivities are empty', () => {
    const audit: BalanceAudit = { groups: [makeGroup()], outliers: [], tierSensitivities: [] };
    const output = formatAuditReport(audit);
    expect(output).toContain('No unusual tier scaling detected.');
  });

  it('renders tier sensitivity table', () => {
    const sensitivity = makeTierSensitivity({ ratio: 3.0, deviation: 1.0 });
    const audit: BalanceAudit = { groups: [makeGroup()], outliers: [], tierSensitivities: [sensitivity] };
    const output = formatAuditReport(audit);
    expect(output).toContain('3.00x');
    expect(output).toContain('+1.00');
  });

  it('renders infinity spread as unicode symbol', () => {
    const group = makeGroup({ spread: Infinity });
    const audit: BalanceAudit = { groups: [group], outliers: [], tierSensitivities: [] };
    const output = formatAuditReport(audit);
    expect(output).toContain('\u221E');
    expect(output).not.toContain('Infinityx');
  });

  it('capitalizes tier name in group summary', () => {
    const group = makeGroup({ tier: 'low' });
    const audit: BalanceAudit = { groups: [group], outliers: [], tierSensitivities: [] };
    const output = formatAuditReport(audit);
    expect(output).toContain('Low');
  });

  it('does not show empty-state messages when data is present', () => {
    const audit: BalanceAudit = {
      groups: [makeGroup()],
      outliers: [makeOutlier()],
      tierSensitivities: [makeTierSensitivity()],
    };
    const output = formatAuditReport(audit);
    expect(output).not.toContain('No outliers detected');
    expect(output).not.toContain('No unusual tier scaling detected');
  });
});

function makeGroup(overrides: Partial<GroupSummary> = {}): GroupSummary {
  return {
    scenario: 'Buffed', tier: 'high', mean: 200000, stdDev: 15000,
    min: 170000, max: 230000, spread: 1.35, count: 5, ...overrides,
  };
}

function makeOutlier(overrides: Partial<OutlierEntry> = {}): OutlierEntry {
  return {
    className: 'NL', skillName: 'Triple Throw 30',
    scenario: 'Buffed', tier: 'high', dps: 350000,
    deviations: 2.5, direction: 'over' as const, ...overrides,
  };
}

function makeTierSensitivity(overrides: Partial<TierSensitivity> = {}): TierSensitivity {
  return {
    className: 'NL', skillName: 'Triple Throw 30', scenario: 'Buffed',
    highDps: 300000, lowDps: 100000, ratio: 3.0,
    medianRatio: 2.0, deviation: 1.0, ...overrides,
  };
}
