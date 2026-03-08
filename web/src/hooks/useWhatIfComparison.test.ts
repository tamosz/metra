import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useWhatIfComparison, type WhatIfComparisonOptions } from './useWhatIfComparison.js';

describe('useWhatIfComparison', () => {
  it('returns null result and null error when changes is empty', () => {
    const { result } = renderHook(() =>
      useWhatIfComparison({ changes: [] }),
    );
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('returns a ComparisonResult when given a valid change', () => {
    const options: WhatIfComparisonOptions = {
      changes: [
        { target: 'hero.brandish-sword', field: 'basePower', to: 280 },
      ],
    };
    const { result } = renderHook(() => useWhatIfComparison(options));
    expect(result.current.error).toBeNull();
    expect(result.current.result).not.toBeNull();
    const comparison = result.current.result!;
    expect(comparison.proposal.changes).toEqual(options.changes);
    expect(comparison.before.length).toBeGreaterThan(0);
    expect(comparison.after.length).toBeGreaterThan(0);
    expect(comparison.deltas.length).toBeGreaterThan(0);
  });

  it('includes training scenario when targetCount > 1', () => {
    const options: WhatIfComparisonOptions = {
      changes: [
        { target: 'hero.brandish-sword', field: 'basePower', to: 280 },
      ],
      targetCount: 6,
    };
    const { result } = renderHook(() => useWhatIfComparison(options));
    expect(result.current.error).toBeNull();
    const scenarios = new Set(
      result.current.result!.before.map((r) => r.scenario),
    );
    expect(scenarios.has('Baseline')).toBe(true);
    expect(scenarios.has('Training (6 mobs)')).toBe(true);
  });

  it('passes buff overrides through to scenarios', () => {
    const options: WhatIfComparisonOptions = {
      changes: [
        { target: 'hero.brandish-sword', field: 'basePower', to: 280 },
      ],
      buffOverrides: { sharpEyes: false },
    };
    const { result } = renderHook(() => useWhatIfComparison(options));
    expect(result.current.error).toBeNull();
    expect(result.current.result).not.toBeNull();
    expect(result.current.result!.before.length).toBeGreaterThan(0);
  });

  it('returns an error when the change targets a nonexistent class', () => {
    const options: WhatIfComparisonOptions = {
      changes: [
        { target: 'fakeclass.fakeskill', field: 'basePower', to: 999 },
      ],
    };
    const { result } = renderHook(() => useWhatIfComparison(options));
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeInstanceOf(Error);
  });

  it('recomputes when changes array identity changes', () => {
    const changes1 = [
      { target: 'hero.brandish-sword', field: 'basePower', to: 280 as number | string },
    ];
    const changes2 = [
      { target: 'hero.brandish-sword', field: 'basePower', to: 300 as number | string },
    ];

    const { result, rerender } = renderHook(
      ({ changes }) => useWhatIfComparison({ changes }),
      { initialProps: { changes: changes1 } },
    );

    expect(result.current.error).toBeNull();
    expect(result.current.result).not.toBeNull();
    const firstHeroDelta = result.current.result!.deltas.find(
      (d) => d.className === 'Hero',
    );
    expect(firstHeroDelta).toBeDefined();
    const firstAfterDps = firstHeroDelta!.after;

    rerender({ changes: changes2 });

    expect(result.current.error).toBeNull();
    expect(result.current.result).not.toBeNull();
    const secondHeroDelta = result.current.result!.deltas.find(
      (d) => d.className === 'Hero',
    );
    expect(secondHeroDelta).toBeDefined();
    const secondAfterDps = secondHeroDelta!.after;

    // basePower 300 should yield higher DPS than basePower 280
    expect(secondAfterDps).toBeGreaterThan(firstAfterDps);
  });
});
