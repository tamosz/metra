import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSimulation } from './useSimulation.js';

describe('useSimulation', () => {
  it('returns results with expected shape', () => {
    const { result } = renderHook(() => useSimulation());

    expect(result.current.results).toBeInstanceOf(Array);
    expect(result.current.results.length).toBeGreaterThan(0);
    expect(result.current.classNames.length).toBeGreaterThan(0);
    expect(result.current.tiers).toContain('low');
    expect(result.current.tiers).toContain('high');
  });

  it('includes all 5 default scenarios', () => {
    const { result } = renderHook(() => useSimulation());

    expect(result.current.scenarios).toEqual([
      'Buffed',
      'Unbuffed',
      'No-Echo',
      'Bossing (50% PDR)',
      'Bossing (Undead, 50% PDR)',
    ]);
  });

  it('returns results for every scenario', () => {
    const { result } = renderHook(() => useSimulation());

    const scenariosInResults = new Set(result.current.results.map((r) => r.scenario));
    for (const scenario of result.current.scenarios) {
      expect(scenariosInResults.has(scenario)).toBe(true);
    }
  });

  it('each result has positive DPS', () => {
    const { result } = renderHook(() => useSimulation());

    for (const r of result.current.results) {
      expect(r.dps.dps).toBeGreaterThan(0);
    }
  });
});
