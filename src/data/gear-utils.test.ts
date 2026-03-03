import { describe, it, expect } from 'vitest';
import { computeGearTotals } from './gear-utils.js';

describe('computeGearTotals', () => {
  it('sums physical class stats (STR/DEX/WATK)', () => {
    const breakdown = {
      weapon: { STR: 21, DEX: 0, WATK: 140 },
      helmet: { STR: 21, DEX: 40, WATK: 0 },
      top: { STR: 60, DEX: 8, WATK: 0 },
      glove: { STR: 0, DEX: 0, WATK: 20 },
      cape: { STR: 0, DEX: 0, WATK: 18 },
    };

    const result = computeGearTotals(breakdown);

    expect(result.gearStats).toEqual({ STR: 102, DEX: 48, INT: 0, LUK: 0 });
    expect(result.totalWeaponAttack).toBe(178);
  });

  it('sums mage stats (INT/MATK)', () => {
    const breakdown = {
      weapon: { INT: 20, MATK: 145 },
      helmet: { INT: 40, MATK: 0 },
      top: { INT: 30, MATK: 0 },
      pendant: { INT: 22, MATK: 0 },
    };

    const result = computeGearTotals(breakdown);

    expect(result.gearStats).toEqual({ STR: 0, DEX: 0, INT: 112, LUK: 0 });
    expect(result.totalWeaponAttack).toBe(145);
  });

  it('sums thief stats (LUK/DEX/WATK)', () => {
    const breakdown = {
      weapon: { LUK: 3, DEX: 0, WATK: 91 },
      helmet: { LUK: 20, DEX: 40, WATK: 0 },
      glove: { LUK: 0, DEX: 0, WATK: 20 },
    };

    const result = computeGearTotals(breakdown);

    expect(result.gearStats).toEqual({ STR: 0, DEX: 40, INT: 0, LUK: 23 });
    expect(result.totalWeaponAttack).toBe(111);
  });

  it('handles mixed STR/DEX/LUK (Shadower-style)', () => {
    const breakdown = {
      weapon: { LUK: 21, DEX: 0, STR: 0, WATK: 140 },
      shield: { LUK: 0, DEX: 0, STR: 21, WATK: 43 },
    };

    const result = computeGearTotals(breakdown);

    expect(result.gearStats).toEqual({ STR: 21, DEX: 0, INT: 0, LUK: 21 });
    expect(result.totalWeaponAttack).toBe(183);
  });

  it('skips comment field', () => {
    const breakdown = {
      weapon: { STR: 10, WATK: 100 },
      comment: 'Some note about the build' as unknown as Record<string, number>,
    };

    const result = computeGearTotals(breakdown);

    expect(result.gearStats.STR).toBe(10);
    expect(result.totalWeaponAttack).toBe(100);
  });

  it('returns zeros for empty breakdown', () => {
    const result = computeGearTotals({});

    expect(result.gearStats).toEqual({ STR: 0, DEX: 0, INT: 0, LUK: 0 });
    expect(result.totalWeaponAttack).toBe(0);
  });
});
