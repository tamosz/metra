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

  it('bestA is the highest-DPS skill from buildA results', () => {
    const { result } = renderHook(() => useBuildComparison());

    const bestA = result.current.comparison.bestA!;
    const maxDps = Math.max(...result.current.buildA.results.map((r) => r.dps));
    expect(bestA.dps).toBe(maxDps);

    // Verify the skill name matches
    const maxRow = result.current.buildA.results.find((r) => r.dps === maxDps)!;
    expect(bestA.skillName).toBe(maxRow.skillName);
  });

  it('bestB is the highest-DPS skill from buildB results', () => {
    const { result } = renderHook(() => useBuildComparison());

    const bestB = result.current.comparison.bestB!;
    const maxDps = Math.max(...result.current.buildB.results.map((r) => r.dps));
    expect(bestB.dps).toBe(maxDps);
  });

  it('deltaPercent is positive when B has higher WATK', () => {
    const { result } = renderHook(() => useBuildComparison());

    act(() => {
      result.current.buildB.setOverride('totalWeaponAttack', 999);
    });

    // B should win → positive delta
    expect(result.current.comparison.deltaPercent).toBeGreaterThan(0);
  });

  it('deltaPercent is negative when A has higher WATK', () => {
    const { result } = renderHook(() => useBuildComparison());

    act(() => {
      result.current.buildA.setOverride('totalWeaponAttack', 999);
    });

    // A wins → B is weaker → negative delta
    expect(result.current.comparison.deltaPercent).toBeLessThan(0);
  });
});
