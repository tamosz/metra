import { describe, it, expect, beforeAll } from 'vitest';
import { loadAttackSpeed } from '../data/loader.js';
import type { AttackSpeedData } from '../data/types.js';
import { resolveEffectiveWeaponSpeed, lookupAttackTime } from './attack-speed.js';

let attackSpeedData: AttackSpeedData;

beforeAll(() => {
  attackSpeedData = loadAttackSpeed();
});

describe('resolveEffectiveWeaponSpeed', () => {
  it('reduces by 4 with SI (booster + SI)', () => {
    // Weapon speed 6 with SI: max(2, 6-4) = 2
    expect(resolveEffectiveWeaponSpeed(6, true)).toBe(2);
  });

  it('reduces by 2 without SI (booster only)', () => {
    // Weapon speed 6 without SI: max(2, 6-2) = 4
    expect(resolveEffectiveWeaponSpeed(6, false)).toBe(4);
  });

  it('clamps to minimum speed 2', () => {
    // Weapon speed 5 with SI: max(2, 5-4) = max(2, 1) = 2
    expect(resolveEffectiveWeaponSpeed(5, true)).toBe(2);
    // Weapon speed 3 with SI: max(2, 3-4) = max(2, -1) = 2
    expect(resolveEffectiveWeaponSpeed(3, true)).toBe(2);
  });
});

describe('lookupAttackTime', () => {
  it('finds Brandish at speed 2 = 0.63s', () => {
    expect(lookupAttackTime(attackSpeedData, 2, 'Brandish')).toBe(0.63);
  });

  it('finds Brandish at speed 4 = 0.75s', () => {
    expect(lookupAttackTime(attackSpeedData, 4, 'Brandish')).toBe(0.75);
  });

  it('finds Crusher at speed 2 = 0.81s', () => {
    expect(lookupAttackTime(attackSpeedData, 2, 'Crusher')).toBe(0.81);
  });

  it('throws on unknown skill category', () => {
    expect(() =>
      lookupAttackTime(attackSpeedData, 2, 'Nonexistent')
    ).toThrow('Unknown skill category');
  });
});
