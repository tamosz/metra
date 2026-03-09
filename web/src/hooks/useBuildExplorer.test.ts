import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBuildExplorer } from './useBuildExplorer.js';

describe('useBuildExplorer', () => {
  it('returns non-empty initial state', () => {
    const { result } = renderHook(() => useBuildExplorer());

    expect(result.current.classNames.length).toBeGreaterThan(0);
    expect(result.current.tiers.length).toBeGreaterThan(0);
    expect(result.current.template).not.toBeNull();
    expect(result.current.effectiveBuild).not.toBeNull();
    expect(result.current.results.length).toBeGreaterThan(0);
  });

  it('results have expected shape with zero changePercent when no overrides', () => {
    const { result } = renderHook(() => useBuildExplorer());

    for (const row of result.current.results) {
      expect(typeof row.skillName).toBe('string');
      expect(row.dps).toBeGreaterThan(0);
      expect(row.baselineDps).toBeGreaterThan(0);
      expect(row.changePercent).toBe(0);
    }
  });

  it('setClass clears overrides', () => {
    const { result } = renderHook(() => useBuildExplorer());

    act(() => {
      result.current.setOverride('baseSTR', 500);
    });
    expect(result.current.overrides).toHaveProperty('baseSTR', 500);

    // Switch to a different class
    const otherClass = result.current.classNames.find(
      (c) => c !== result.current.selectedClass
    )!;
    act(() => {
      result.current.setClass(otherClass);
    });

    expect(result.current.overrides).toEqual({});
    expect(result.current.selectedClass).toBe(otherClass);
  });

  it('setTier clears overrides', () => {
    const { result } = renderHook(() => useBuildExplorer());

    act(() => {
      result.current.setOverride('baseSTR', 500);
    });
    expect(result.current.overrides).toHaveProperty('baseSTR', 500);

    act(() => {
      result.current.setTier('low');
    });

    expect(result.current.overrides).toEqual({});
    expect(result.current.selectedTier).toBe('low');
  });

  it('setOverride merges multiple keys', () => {
    const { result } = renderHook(() => useBuildExplorer());

    act(() => {
      result.current.setOverride('baseSTR', 500);
    });
    act(() => {
      result.current.setOverride('sharpEyes', false);
    });

    expect(result.current.overrides).toHaveProperty('baseSTR', 500);
    expect(result.current.overrides).toHaveProperty('sharpEyes', false);
  });

  it('resetField removes a single key', () => {
    const { result } = renderHook(() => useBuildExplorer());

    act(() => {
      result.current.setOverride('baseSTR', 500);
    });
    act(() => {
      result.current.setOverride('baseDEX', 200);
    });
    expect(result.current.overrides).toHaveProperty('baseSTR');
    expect(result.current.overrides).toHaveProperty('baseDEX');

    act(() => {
      result.current.resetField('baseSTR');
    });

    expect(result.current.overrides).not.toHaveProperty('baseSTR');
    expect(result.current.overrides).toHaveProperty('baseDEX', 200);
  });

  it('resetOverrides clears all overrides', () => {
    const { result } = renderHook(() => useBuildExplorer());

    act(() => {
      result.current.setOverride('baseSTR', 500);
    });
    act(() => {
      result.current.setOverride('baseDEX', 200);
    });
    expect(Object.keys(result.current.overrides).length).toBe(2);

    act(() => {
      result.current.resetOverrides();
    });

    expect(result.current.overrides).toEqual({});
  });

  it('override changes DPS and produces non-zero changePercent', () => {
    const { result } = renderHook(() => useBuildExplorer());

    const baselineDps = result.current.results[0].dps;

    act(() => {
      result.current.setOverride('totalWeaponAttack', 999);
    });

    expect(result.current.results[0].dps).not.toBe(baselineDps);
    expect(result.current.results[0].changePercent).not.toBe(0);
  });

  it('loadFromUrl sets class, tier, and overrides', () => {
    const { result } = renderHook(() => useBuildExplorer());

    act(() => {
      result.current.loadFromUrl('hero', 'low', { baseSTR: 800 });
    });

    expect(result.current.selectedClass).toBe('hero');
    expect(result.current.selectedTier).toBe('low');
    expect(result.current.overrides).toEqual({ baseSTR: 800 });
  });

  it('stat override reaches the correct field on effectiveBuild', () => {
    const { result } = renderHook(() => useBuildExplorer());

    // Select hero so we know the primary stat is STR
    act(() => {
      result.current.setClass('hero');
      result.current.setTier('high');
    });

    const _templateSTR = result.current.template!.baseStats.STR;

    act(() => {
      result.current.setOverride('baseSTR', 999);
    });

    expect(result.current.effectiveBuild!.baseStats.STR).toBe(999);
    // Other stats should remain unchanged
    expect(result.current.effectiveBuild!.baseStats.DEX).toBe(result.current.template!.baseStats.DEX);
  });

  it('boolean override reaches the correct field on effectiveBuild', () => {
    const { result } = renderHook(() => useBuildExplorer());

    act(() => {
      result.current.setOverride('sharpEyes', false);
    });

    expect(result.current.effectiveBuild!.sharpEyes).toBe(false);
  });

  it('totalWeaponAttack override reaches effectiveBuild', () => {
    const { result } = renderHook(() => useBuildExplorer());

    act(() => {
      result.current.setOverride('totalWeaponAttack', 500);
    });

    expect(result.current.effectiveBuild!.totalWeaponAttack).toBe(500);
  });
});
