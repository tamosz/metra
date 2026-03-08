import { describe, it, expect, beforeAll } from 'vitest';
import { loadAttackSpeed } from '../data/loader.js';
import {
  resolveEffectiveWeaponSpeed,
  lookupAttackTime,
  type AttackSpeedData,
} from '@metra/engine';

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

  it('speed 5 without SI = 3', () => {
    expect(resolveEffectiveWeaponSpeed(5, false)).toBe(3);
  });

  it('speed 4 without SI = 2 (clamped)', () => {
    expect(resolveEffectiveWeaponSpeed(4, false)).toBe(2);
  });

  it('speed 8 without SI = 6', () => {
    expect(resolveEffectiveWeaponSpeed(8, false)).toBe(6);
  });

  it('speed 8 with SI = 4', () => {
    expect(resolveEffectiveWeaponSpeed(8, true)).toBe(4);
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

  describe('VLOOKUP approximate match', () => {
    it('falls back to largest speed <= effectiveSpeed for unlisted speed', () => {
      // Speed 7 not in data (max is 6), should fall back to speed 6
      const result = lookupAttackTime(attackSpeedData, 7, 'Brandish');
      const expected = lookupAttackTime(attackSpeedData, 6, 'Brandish');
      expect(result).toBe(expected);
    });

    it('falls back correctly for large unlisted speed', () => {
      // Speed 10 should also fall back to speed 6
      const result = lookupAttackTime(attackSpeedData, 10, 'Crusher');
      const expected = lookupAttackTime(attackSpeedData, 6, 'Crusher');
      expect(result).toBe(expected);
    });
  });

  describe('throws when no valid entry exists', () => {
    it('throws for speed below all entries', () => {
      expect(() =>
        lookupAttackTime(attackSpeedData, 1, 'Brandish')
      ).toThrow('No attack speed entry found for effective speed 1');
    });

    it('throws for negative speed', () => {
      expect(() =>
        lookupAttackTime(attackSpeedData, -1, 'Brandish')
      ).toThrow('No attack speed entry found for effective speed -1');
    });
  });

  describe('fixed-time categories', () => {
    it('Hurricane is 0.12s at all speeds', () => {
      for (const speed of [2, 3, 4, 5, 6]) {
        expect(lookupAttackTime(attackSpeedData, speed, 'Hurricane')).toBe(0.12);
      }
    });

    it('Demolition is 2.34s at all speeds', () => {
      for (const speed of [2, 3, 4, 5, 6]) {
        expect(lookupAttackTime(attackSpeedData, speed, 'Demolition')).toBe(2.34);
      }
    });

    it('Barrage + Demolition is 4.04s at all speeds', () => {
      for (const speed of [2, 3, 4, 5, 6]) {
        expect(lookupAttackTime(attackSpeedData, speed, 'Barrage + Demolition')).toBe(4.04);
      }
    });

    it('Chain Lightning is 0.69s at all speeds', () => {
      for (const speed of [2, 3, 4, 5, 6]) {
        expect(lookupAttackTime(attackSpeedData, speed, 'Chain Lightning')).toBe(0.69);
      }
    });

    it('Blizzard is 3.06s at all speeds', () => {
      for (const speed of [2, 3, 4, 5, 6]) {
        expect(lookupAttackTime(attackSpeedData, speed, 'Blizzard')).toBe(3.06);
      }
    });

    it('Angel Ray is 0.81s at all speeds', () => {
      for (const speed of [2, 3, 4, 5, 6]) {
        expect(lookupAttackTime(attackSpeedData, speed, 'Angel Ray')).toBe(0.81);
      }
    });

    it('Genesis is 2.70s at all speeds', () => {
      for (const speed of [2, 3, 4, 5, 6]) {
        expect(lookupAttackTime(attackSpeedData, speed, 'Genesis')).toBe(2.70);
      }
    });

    it('Snipe Rotation is 5.00s at all speeds', () => {
      for (const speed of [2, 3, 4, 5, 6]) {
        expect(lookupAttackTime(attackSpeedData, speed, 'Snipe Rotation')).toBe(5.00);
      }
    });
  });

  describe('speed-dependent categories vary correctly', () => {
    it('Brandish gets slower at higher speeds', () => {
      const speed2 = lookupAttackTime(attackSpeedData, 2, 'Brandish');
      const speed6 = lookupAttackTime(attackSpeedData, 6, 'Brandish');
      expect(speed2).toBeLessThan(speed6);
    });

    it('Strafe in Snipe Rotation varies with speed', () => {
      const speed2 = lookupAttackTime(attackSpeedData, 2, 'Strafe in Snipe Rotation');
      const speed6 = lookupAttackTime(attackSpeedData, 6, 'Strafe in Snipe Rotation');
      expect(speed2).toBe(0.714);
      expect(speed6).toBe(1.25);
    });
  });
});
