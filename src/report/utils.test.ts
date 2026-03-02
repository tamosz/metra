import { describe, it, expect } from 'vitest';
import {
  formatNumber,
  formatChange,
  formatPercent,
  formatRank,
  capitalize,
  sortDeltas,
  groupDeltasByScenario,
  groupResultsByScenario,
} from './utils.js';
import type { DeltaEntry, ScenarioResult } from '../proposals/types.js';
import type { DpsResult } from '../engine/dps.js';

describe('formatNumber', () => {
  it('formats zero as "0"', () => {
    expect(formatNumber(0)).toBe('0');
  });

  it('formats large numbers with thousands separators', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
  });

  it('formats negative numbers with thousands separators', () => {
    expect(formatNumber(-42000)).toBe('-42,000');
  });

  it('formats numbers under 1000 without separators', () => {
    expect(formatNumber(999)).toBe('999');
  });
});

describe('formatChange', () => {
  it('formats positive changes with + prefix', () => {
    expect(formatChange(5000)).toBe('+5,000');
  });

  it('formats negative changes with - prefix', () => {
    expect(formatChange(-3000)).toBe('-3,000');
  });

  it('formats zero without prefix', () => {
    expect(formatChange(0)).toBe('0');
  });
});

describe('formatPercent', () => {
  it('formats positive percentages with + prefix and one decimal', () => {
    expect(formatPercent(12.34)).toBe('+12.3%');
  });

  it('formats negative percentages with - prefix and one decimal', () => {
    expect(formatPercent(-5.67)).toBe('-5.7%');
  });

  it('formats zero as "0.0%"', () => {
    expect(formatPercent(0)).toBe('0.0%');
  });
});

describe('formatRank', () => {
  it('formats rank change with unicode arrow', () => {
    expect(formatRank(3, 5)).toBe('3\u21925');
  });

  it('formats unchanged rank as single number', () => {
    expect(formatRank(2, 2)).toBe('2');
  });

  it('returns dash when before rank is undefined', () => {
    expect(formatRank(undefined, 3)).toBe('-');
  });
});

describe('capitalize', () => {
  it('capitalizes the first letter of a string', () => {
    expect(capitalize('hello')).toBe('Hello');
  });
});

describe('sortDeltas', () => {
  it('sorts changed entries before unchanged entries', () => {
    const unchanged = makeDelta({ className: 'DrK', change: 0, changePercent: 0 });
    const changed = makeDelta({ className: 'Hero', change: 5000, changePercent: 5 });

    const sorted = sortDeltas([unchanged, changed]);

    expect(sorted[0].className).toBe('Hero');
    expect(sorted[1].className).toBe('DrK');
  });

  it('sorts changed entries by absolute changePercent descending', () => {
    const smallChange = makeDelta({ className: 'Hero', change: 1000, changePercent: 2 });
    const bigChange = makeDelta({ className: 'DrK', change: -5000, changePercent: -10 });

    const sorted = sortDeltas([smallChange, bigChange]);

    expect(sorted[0].className).toBe('DrK');
    expect(sorted[1].className).toBe('Hero');
  });

  it('sorts unchanged entries alphabetically by className then tier', () => {
    const palLow = makeDelta({ className: 'Paladin', tier: 'low', change: 0, changePercent: 0 });
    const drkHigh = makeDelta({ className: 'DrK', tier: 'high', change: 0, changePercent: 0 });
    const drkLow = makeDelta({ className: 'DrK', tier: 'low', change: 0, changePercent: 0 });

    const sorted = sortDeltas([palLow, drkLow, drkHigh]);

    expect(sorted[0]).toEqual(drkLow);
    expect(sorted[1]).toEqual(drkHigh);
    expect(sorted[2]).toEqual(palLow);
  });

  it('sorts a mixed set correctly: changed by |%| desc, then unchanged alphabetically', () => {
    const heroChanged = makeDelta({ className: 'Hero', change: 5000, changePercent: 5 });
    const nlChanged = makeDelta({ className: 'NL', change: -8000, changePercent: -8 });
    const drkUnchanged = makeDelta({ className: 'DrK', tier: 'high', change: 0, changePercent: 0 });
    const palUnchanged = makeDelta({ className: 'Paladin', tier: 'low', change: 0, changePercent: 0 });

    const sorted = sortDeltas([drkUnchanged, heroChanged, palUnchanged, nlChanged]);

    expect(sorted[0].className).toBe('NL');
    expect(sorted[1].className).toBe('Hero');
    expect(sorted[2].className).toBe('DrK');
    expect(sorted[3].className).toBe('Paladin');
  });
});

describe('groupDeltasByScenario', () => {
  it('groups deltas preserving insertion order', () => {
    const buffedDelta = makeDelta({ scenario: 'Buffed' });
    const bossingDelta = makeDelta({ scenario: 'Bossing (50% PDR)' });
    const buffedDelta2 = makeDelta({ scenario: 'Buffed', className: 'DrK' });

    const groups = groupDeltasByScenario([buffedDelta, bossingDelta, buffedDelta2]);

    expect(groups).toHaveLength(2);
    expect(groups[0].scenario).toBe('Buffed');
    expect(groups[0].deltas).toHaveLength(2);
    expect(groups[1].scenario).toBe('Bossing (50% PDR)');
    expect(groups[1].deltas).toHaveLength(1);
  });

  it('defaults undefined scenario to "Buffed"', () => {
    const deltaWithoutScenario = makeDelta({});
    // Force scenario to undefined to test the fallback
    (deltaWithoutScenario as unknown as Record<string, unknown>).scenario = undefined;

    const groups = groupDeltasByScenario([deltaWithoutScenario]);

    expect(groups).toHaveLength(1);
    expect(groups[0].scenario).toBe('Buffed');
    expect(groups[0].deltas).toHaveLength(1);
  });
});

describe('groupResultsByScenario', () => {
  it('groups results by scenario name preserving insertion order', () => {
    const buffedResult = makeResult({ scenario: 'Buffed', className: 'Hero' });
    const bossingResult = makeResult({ scenario: 'Bossing (50% PDR)', className: 'Hero' });
    const buffedResult2 = makeResult({ scenario: 'Buffed', className: 'DrK' });
    const bossingKbResult = makeResult({ scenario: 'Bossing (KB)', className: 'Hero' });

    const groups = groupResultsByScenario([
      buffedResult,
      bossingResult,
      buffedResult2,
      bossingKbResult,
    ]);

    expect(groups).toHaveLength(3);
    expect(groups[0].scenario).toBe('Buffed');
    expect(groups[0].results).toHaveLength(2);
    expect(groups[1].scenario).toBe('Bossing (50% PDR)');
    expect(groups[1].results).toHaveLength(1);
    expect(groups[2].scenario).toBe('Bossing (KB)');
    expect(groups[2].results).toHaveLength(1);
  });
});

// --- Inline helpers ---

function makeDelta(overrides: Partial<DeltaEntry> = {}): DeltaEntry {
  return {
    className: 'Hero',
    skillName: 'Brandish',
    tier: 'high',
    scenario: 'Buffed',
    before: 100000,
    after: 100000,
    change: 0,
    changePercent: 0,
    ...overrides,
  };
}

function makeDpsResult(dps: number): DpsResult {
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

function makeResult(overrides: Partial<ScenarioResult> = {}): ScenarioResult {
  return {
    className: 'Hero',
    skillName: 'Brandish',
    tier: 'high',
    scenario: 'Buffed',
    dps: makeDpsResult(100000),
    ...overrides,
  };
}
