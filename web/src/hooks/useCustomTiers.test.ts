import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCustomTiers } from './useCustomTiers.js';
import type { CustomTier, CustomTierAdjustments } from '../types/custom-tier.js';
import { DEFAULT_ADJUSTMENTS } from '../types/custom-tier.js';

const STORAGE_KEY = 'royals-sim:custom-tiers';

const testAdjustments: CustomTierAdjustments = {
  primaryStatDelta: 50,
  secondaryStatDelta: 10,
  watkDelta: 20,
  attackPotion: null,
  echoActive: null,
  sharpEyes: null,
  speedInfusion: null,
  mwLevel: null,
};

beforeEach(() => {
  localStorage.clear();
});

describe('useCustomTiers', () => {
  it('returns empty tiers on empty storage', () => {
    const { result } = renderHook(() => useCustomTiers());
    expect(result.current.tiers).toEqual([]);
  });

  it('loads pre-populated tiers from storage', () => {
    const existing: CustomTier = {
      id: 'ct-existing',
      name: 'Existing',
      baseTier: 'high',
      adjustments: { ...DEFAULT_ADJUSTMENTS },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([existing]));

    const { result } = renderHook(() => useCustomTiers());
    expect(result.current.tiers).toEqual([existing]);
  });

  it('add() appends a tier with generated id and persists', () => {
    const { result } = renderHook(() => useCustomTiers());

    let added: CustomTier;
    act(() => {
      added = result.current.add('New Tier', 'low', testAdjustments);
    });

    expect(added!.id).toMatch(/^ct-/);
    expect(added!.name).toBe('New Tier');
    expect(added!.baseTier).toBe('low');
    expect(added!.adjustments).toEqual({ ...DEFAULT_ADJUSTMENTS, ...testAdjustments });

    expect(result.current.tiers).toHaveLength(1);
    expect(result.current.tiers[0].id).toBe(added!.id);

    // Verify persisted to localStorage
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe(added!.id);
  });

  it('update() modifies an existing tier by id and persists', () => {
    const { result } = renderHook(() => useCustomTiers());

    let added: CustomTier;
    act(() => {
      added = result.current.add('Original', 'high', testAdjustments);
    });

    act(() => {
      result.current.update(added!.id, { name: 'Renamed' });
    });

    expect(result.current.tiers[0].name).toBe('Renamed');
    expect(result.current.tiers[0].baseTier).toBe('high'); // unchanged

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored[0].name).toBe('Renamed');
  });

  it('remove() filters out tier by id and persists', () => {
    const { result } = renderHook(() => useCustomTiers());

    let first: CustomTier;
    let second: CustomTier;
    act(() => {
      first = result.current.add('First', 'low', testAdjustments);
      second = result.current.add('Second', 'high', testAdjustments);
    });

    act(() => {
      result.current.remove(first!.id);
    });

    expect(result.current.tiers).toHaveLength(1);
    expect(result.current.tiers[0].id).toBe(second!.id);

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored).toHaveLength(1);
  });

  it('gracefully handles corrupt storage on initial load', () => {
    localStorage.setItem(STORAGE_KEY, 'not valid json');
    const { result } = renderHook(() => useCustomTiers());
    expect(result.current.tiers).toEqual([]);
  });
});
