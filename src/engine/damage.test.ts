import { describe, it, expect } from 'vitest';
import {
  calculateDamageRange,
  calculateAdjustedRange,
  calculateRangeCap,
  getWeaponMultiplier,
} from './damage.js';
import { loadWeapons } from '../data/loader.js';

describe('getWeaponMultiplier', () => {
  it('returns correct multiplier for 2H Sword', () => {
    const weapons = loadWeapons();
    expect(getWeaponMultiplier(weapons, '2H Sword')).toBe(4.6);
  });
});

describe('calculateDamageRange', () => {
  it('computes Hero High tier range (2H Sword)', () => {
    // STR=1272, DEX=127, weapMult=4.6, mastery=0.6, totalAttack=326
    const range = calculateDamageRange(1272, 127, 4.6, 0.6, 326);
    expect(range.max).toBe(19488);
    expect(range.min).toBe(10714);
    expect(range.average).toBe(15101);
  });

  it('computes Hero Low tier range (2H Sword)', () => {
    // STR=877, DEX=120, weapMult=4.6, mastery=0.6, totalAttack=247
    const range = calculateDamageRange(877, 120, 4.6, 0.6, 247);
    expect(range.max).toBe(10260);
    expect(range.min).toBe(5677);
    expect(range.average).toBe(7968.5);
  });

  it('matches DrK range calculator values', () => {
    // From range calculator (DrK, spear mult=5.0, mastery=0.8)
    // STR=1272, DEX=127, totalAttack=203+100+12=315
    // E18=14824, E19=20434
    const range = calculateDamageRange(1272, 127, 5.0, 0.8, 315);
    expect(range.min).toBe(14824);
    expect(range.max).toBe(20434);
  });
});

describe('calculateRangeCap', () => {
  it('computes range cap for 494% skill damage', () => {
    const cap = calculateRangeCap(199999, 494);
    expect(cap).toBeCloseTo(40485.627, 2);
  });

  it('computes range cap for 760% SE damage', () => {
    const cap = calculateRangeCap(199999, 760);
    expect(cap).toBeCloseTo(26315.658, 2);
  });
});

describe('calculateAdjustedRange', () => {
  it('returns average when not capping (Hero High, normal)', () => {
    // rangeCap=40485 > maxRange=19488, no capping
    const range = { min: 10714, max: 19488, average: 15101 };
    const adjusted = calculateAdjustedRange(range, 40485.627);
    expect(adjusted).toBe(15101);
  });

  it('returns average when not capping (Hero High, SE)', () => {
    // rangeCap=26315 > maxRange=19488, no capping
    const range = { min: 10714, max: 19488, average: 15101 };
    const adjusted = calculateAdjustedRange(range, 26315.658);
    expect(adjusted).toBe(15101);
  });

  it('correctly adjusts range when capping', () => {
    // Synthetic scenario: range 10000-20000, cap at 15000
    const range = { min: 10000, max: 20000, average: 15000 };
    const adjusted = calculateAdjustedRange(range, 15000);
    // ratio = (15000-10000)/(20000-10000) = 0.5
    // adjusted = (15000+10000)/2 * 0.5 + 15000 * 0.5
    //          = 12500 * 0.5 + 7500 = 6250 + 7500 = 13750
    expect(adjusted).toBe(13750);
  });

  it('returns cap when cap <= min', () => {
    const range = { min: 10000, max: 20000, average: 15000 };
    const adjusted = calculateAdjustedRange(range, 5000);
    expect(adjusted).toBe(5000);
  });
});
