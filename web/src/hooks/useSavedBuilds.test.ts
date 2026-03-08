import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSavedBuilds } from './useSavedBuilds.js';
import type { SavedBuild } from '../types/saved-build.js';

const STORAGE_KEY = 'royals-sim:saved-builds';

beforeEach(() => {
  localStorage.clear();
});

describe('useSavedBuilds', () => {
  it('returns empty builds on empty storage', () => {
    const { result } = renderHook(() => useSavedBuilds());
    expect(result.current.builds).toEqual([]);
  });

  it('loads pre-populated builds from storage', () => {
    const existing: SavedBuild = {
      id: 'sb-existing',
      name: 'My Build',
      className: 'hero',
      tier: 'high',
      overrides: { totalWeaponAttack: 200 },
      savedAt: 1000,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([existing]));

    const { result } = renderHook(() => useSavedBuilds());
    expect(result.current.builds).toEqual([existing]);
  });

  it('save() creates a build with id, name, className, tier, overrides, and savedAt', () => {
    const { result } = renderHook(() => useSavedBuilds());

    const beforeSave = Date.now();
    let saved: SavedBuild;
    act(() => {
      saved = result.current.save('Test Build', 'night-lord', 'high', { totalWeaponAttack: 150 });
    });

    expect(saved!.id).toMatch(/^sb-/);
    expect(saved!.name).toBe('Test Build');
    expect(saved!.className).toBe('night-lord');
    expect(saved!.tier).toBe('high');
    expect(saved!.overrides).toEqual({ totalWeaponAttack: 150 });
    expect(saved!.savedAt).toBeGreaterThanOrEqual(beforeSave);

    expect(result.current.builds).toHaveLength(1);

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe(saved!.id);
  });

  it('remove() filters by id and persists', () => {
    const { result } = renderHook(() => useSavedBuilds());

    let first: SavedBuild;
    let second: SavedBuild;
    act(() => {
      first = result.current.save('First', 'hero', 'low', {});
      second = result.current.save('Second', 'dark-knight', 'high', {});
    });

    act(() => {
      result.current.remove(first!.id);
    });

    expect(result.current.builds).toHaveLength(1);
    expect(result.current.builds[0].id).toBe(second!.id);

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored).toHaveLength(1);
  });

  it('gracefully handles corrupt storage on initial load', () => {
    localStorage.setItem(STORAGE_KEY, '{{invalid}}');
    const { result } = renderHook(() => useSavedBuilds());
    expect(result.current.builds).toEqual([]);
  });
});
