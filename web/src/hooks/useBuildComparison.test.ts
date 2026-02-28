import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBuildComparison } from './useBuildComparison.js';

describe('useBuildComparison', () => {
  it('returns initial state with non-empty results and non-null best skills', () => {
    const { result } = renderHook(() => useBuildComparison());

    expect(result.current.buildA.results.length).toBeGreaterThan(0);
    expect(result.current.buildB.results.length).toBeGreaterThan(0);
    expect(result.current.comparison.bestA).not.toBeNull();
    expect(result.current.comparison.bestB).not.toBeNull();
  });

  it('sameClass is true initially when both builds default to the same class', () => {
    const { result } = renderHook(() => useBuildComparison());

    expect(result.current.comparison.sameClass).toBe(true);
    expect(result.current.buildA.selectedClass).toBe(result.current.buildB.selectedClass);
  });

  it('sameClass becomes false when builds use different classes', () => {
    const { result } = renderHook(() => useBuildComparison());

    const otherClass = result.current.buildB.classNames.find(
      (c) => c !== result.current.buildA.selectedClass
    )!;

    act(() => {
      result.current.buildB.setClass(otherClass);
    });

    expect(result.current.comparison.sameClass).toBe(false);
  });

  it('deltaPercent is 0 when both builds are identical', () => {
    const { result } = renderHook(() => useBuildComparison());

    expect(result.current.comparison.deltaPercent).toBe(0);
  });

  it('deltaPercent changes when one build has an override', () => {
    const { result } = renderHook(() => useBuildComparison());

    expect(result.current.comparison.deltaPercent).toBe(0);

    act(() => {
      result.current.buildB.setOverride('totalWeaponAttack', 999);
    });

    expect(result.current.comparison.deltaPercent).not.toBe(0);
  });
});
