import { describe, it, expect, beforeEach } from 'vitest';
import { loadCustomTiers, saveCustomTiers } from './storage.js';
import type { CustomTier } from '../types/custom-tier.js';

const STORAGE_KEY = 'royals-sim:custom-tiers';

const sampleTier: CustomTier = {
  id: 'ct-test1',
  name: 'My Tier',
  baseTier: 'high',
  adjustments: {
    primaryStatDelta: 50,
    secondaryStatDelta: 10,
    watkDelta: 20,
    attackPotion: null,
    echoActive: null,
    sharpEyes: null,
    speedInfusion: null,
    mwLevel: null,
  },
};

beforeEach(() => {
  localStorage.clear();
});

describe('loadCustomTiers', () => {
  it('returns empty array when storage is empty', () => {
    expect(loadCustomTiers()).toEqual([]);
  });

  it('returns empty array when key is missing', () => {
    localStorage.setItem('unrelated-key', 'data');
    expect(loadCustomTiers()).toEqual([]);
  });

  it('returns saved tiers from storage', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([sampleTier]));
    expect(loadCustomTiers()).toEqual([sampleTier]);
  });

  it('returns empty array for corrupt JSON', () => {
    localStorage.setItem(STORAGE_KEY, '{not valid json!!!');
    expect(loadCustomTiers()).toEqual([]);
  });
});

describe('saveCustomTiers', () => {
  it('persists tiers to localStorage', () => {
    saveCustomTiers([sampleTier]);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual([sampleTier]);
  });

  it('round-trips correctly', () => {
    const tiers = [sampleTier, { ...sampleTier, id: 'ct-test2', name: 'Second' }];
    saveCustomTiers(tiers);
    expect(loadCustomTiers()).toEqual(tiers);
  });

  it('overwrites previous data', () => {
    saveCustomTiers([sampleTier]);
    saveCustomTiers([]);
    expect(loadCustomTiers()).toEqual([]);
  });
});
