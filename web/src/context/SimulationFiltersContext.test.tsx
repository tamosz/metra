import { describe, it, expect, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { SimulationFiltersProvider, useSimulationFilters } from './SimulationFiltersContext.js';
import type { ReactNode } from 'react';

function wrapper({ children }: { children: ReactNode }) {
  return <SimulationFiltersProvider>{children}</SimulationFiltersProvider>;
}

function renderFilters() {
  return renderHook(() => useSimulationFilters(), { wrapper });
}

describe('filter state', () => {
  afterEach(cleanup);

  it('resetFilters restores all filter state to defaults', () => {
    const { result } = renderFilters();

    act(() => {
      result.current.setTargetCount(6);
      result.current.setCapEnabled(false);
      result.current.setKbEnabled(true);
      result.current.setBossAttackInterval(3.0);
      result.current.setBossAccuracy(300);
      result.current.setBreakdownEnabled(true);
      result.current.setBuffOverrides({ sharpEyes: false });
      result.current.setElementModifiers({ Holy: 1.5 });
      result.current.setEfficiencyOverrides({ hero: [1, 2] });
    });

    act(() => result.current.resetFilters());

    expect(result.current.targetCount).toBe(1);
    expect(result.current.capEnabled).toBe(true);
    expect(result.current.kbEnabled).toBe(false);
    expect(result.current.bossAttackInterval).toBe(1.5);
    expect(result.current.bossAccuracy).toBe(250);
    expect(result.current.breakdownEnabled).toBe(false);
    expect(result.current.buffOverrides).toEqual({});
    expect(result.current.elementModifiers).toEqual({});
    expect(result.current.efficiencyOverrides).toEqual({});
    expect(result.current.activeGroups).toEqual(new Set(['main']));
  });
});
