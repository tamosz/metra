import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAnimatedDps } from './useAnimatedDps.js';
import type { ScenarioResult } from '@engine/proposals/types.js';

function makeResult(className: string, skillName: string, dpsValue: number): ScenarioResult {
  return {
    className,
    skillName,
    scenario: 'Baseline',
    dps: {
      skillName,
      attackTime: 0.6,
      damageRange: { min: 0, max: 0, average: 0 },
      skillDamagePercent: 0,
      critDamagePercent: 0,
      adjustedRangeNormal: 0,
      adjustedRangeCrit: 0,
      averageDamage: 0,
      dps: dpsValue,
      uncappedDps: dpsValue,
      capLossPercent: 0,
      totalCritRate: 0,
      hitCount: 1,
      hasShadowPartner: false,
    },
  };
}

describe('useAnimatedDps', () => {
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('returns zero changeRatio on first render', () => {
    const results = [makeResult('Hero', 'Brandish', 50000)];
    const { result } = renderHook(() => useAnimatedDps(results, true, true));

    expect(result.current.entries.size).toBe(1);
    const entry = result.current.entries.get('Hero|Brandish')!;
    expect(entry.changeRatio).toBe(0);
    expect(entry.isHighImpact).toBe(false);
    expect(entry.previousDps).toBe(50000);
  });

  it('detects high-impact entries after data change', () => {
    const initial = [
      makeResult('Hero', 'Brandish', 50000),
      makeResult('Night Lord', 'Triple Throw', 60000),
      makeResult('Paladin', 'Blast', 40000),
    ];

    const { result, rerender } = renderHook(
      ({ data }) => useAnimatedDps(data, true, true),
      { initialProps: { data: initial } },
    );

    const updated = [
      makeResult('Hero', 'Brandish', 48000),
      makeResult('Night Lord', 'Triple Throw', 40000),
      makeResult('Paladin', 'Blast', 39000),
    ];
    rerender({ data: updated });

    const nlEntry = result.current.entries.get('Night Lord|Triple Throw')!;
    expect(nlEntry.isHighImpact).toBe(true);
    expect(nlEntry.previousDps).toBe(60000);
    expect(nlEntry.changeRatio).toBeGreaterThan(1.5);
  });

  it('suppresses emphasis when all entries shift uniformly', () => {
    const initial = [
      makeResult('Hero', 'Brandish', 50000),
      makeResult('Night Lord', 'Triple Throw', 60000),
    ];

    const { result, rerender } = renderHook(
      ({ data }) => useAnimatedDps(data, true, true),
      { initialProps: { data: initial } },
    );

    const updated = [
      makeResult('Hero', 'Brandish', 45000),
      makeResult('Night Lord', 'Triple Throw', 54000),
    ];
    rerender({ data: updated });

    for (const [, entry] of result.current.entries) {
      expect(entry.isHighImpact).toBe(false);
    }
  });

  it('returns no animation data when disabled', () => {
    const results = [makeResult('Hero', 'Brandish', 50000)];
    const { result, rerender } = renderHook(
      ({ data, enabled }) => useAnimatedDps(data, true, enabled),
      { initialProps: { data: results, enabled: false } },
    );

    const updated = [makeResult('Hero', 'Brandish', 40000)];
    rerender({ data: updated, enabled: false });

    const entry = result.current.entries.get('Hero|Brandish')!;
    expect(entry.changeRatio).toBe(0);
    expect(entry.isHighImpact).toBe(false);
  });

  it('handles zero change (no division by zero)', () => {
    const results = [makeResult('Hero', 'Brandish', 50000)];
    const { result, rerender } = renderHook(
      ({ data }) => useAnimatedDps(data, true, true),
      { initialProps: { data: results } },
    );

    rerender({ data: [...results] });
    const entry = result.current.entries.get('Hero|Brandish')!;
    expect(entry.changeRatio).toBe(0);
    expect(entry.isHighImpact).toBe(false);
  });

  it('exposes prefersReducedMotion', () => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    const { result } = renderHook(() => useAnimatedDps([], true, true));
    expect(result.current.prefersReducedMotion).toBe(true);
  });
});
