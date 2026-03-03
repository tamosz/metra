import { describe, it, expect } from 'vitest';
import { mergeGearTemplate, type TierDefaults, type ClassBase, type TierOverride } from './gear-merge.js';

const tierDefaults: Record<string, TierDefaults> = {
  high: { attackPotion: 100, potionName: 'Apple', cgs: { cape: 18, glove: 20, shoe: 16 } },
};

const classBase: ClassBase = {
  className: 'Hero',
  weaponType: '2H Sword',
  weaponSpeed: 5,
  projectile: 0,
  echoActive: true,
  mwLevel: 20,
  speedInfusion: true,
  sharpEyes: true,
};

const tierOverride: TierOverride = {
  extends: 'hero',
  source: 'test',
  baseStats: { STR: 999, DEX: 23, INT: 4, LUK: 4 },
  gearBreakdown: {
    weapon: { STR: 21, WATK: 140 },
    helmet: { STR: 21, DEX: 40 },
    ring1: { STR: 8, DEX: 5 },
  },
};

describe('mergeGearTemplate', () => {
  it('merges base + tier + defaults into a CharacterBuild', () => {
    const result = mergeGearTemplate(classBase, tierOverride, tierDefaults['high']);
    expect(result.className).toBe('Hero');
    expect(result.weaponType).toBe('2H Sword');
    expect(result.weaponSpeed).toBe(5);
    expect(result.attackPotion).toBe(100);
    expect(result.baseStats.STR).toBe(999);
    expect(result.echoActive).toBe(true);
    expect(result.sharpEyes).toBe(true);
  });

  it('injects CGS slots as WATK into breakdown before computing totals', () => {
    const result = mergeGearTemplate(classBase, tierOverride, tierDefaults['high']);
    // WATK: 140 (weapon) + 18 (cape) + 20 (glove) + 16 (shoe) = 194
    expect(result.totalWeaponAttack).toBe(194);
  });

  it('preserves CGS stats from tier file if they exist (no double-injection)', () => {
    const withCgs: TierOverride = {
      ...tierOverride,
      gearBreakdown: {
        ...tierOverride.gearBreakdown,
        cape: { STR: 5, WATK: 18 },
      },
    };
    const result = mergeGearTemplate(classBase, withCgs, tierDefaults['high']);
    expect(result.totalWeaponAttack).toBe(194);
    expect(result.gearStats.STR).toBe(21 + 21 + 8 + 5);
  });

  it('uses cgsStatName for mages (INT instead of WATK)', () => {
    const mageBase: ClassBase = {
      ...classBase,
      className: 'Archmage I/L',
      weaponType: 'Staff',
      cgsStatName: 'INT',
    };
    const mageTier: TierOverride = {
      extends: 'archmage-il',
      source: 'test',
      baseStats: { STR: 4, DEX: 25, INT: 999, LUK: 4 },
      gearBreakdown: {
        weapon: { INT: 20, MATK: 145 },
      },
    };
    const result = mergeGearTemplate(mageBase, mageTier, tierDefaults['high']);
    expect(result.gearStats.INT).toBe(20 + 18 + 16 + 20);
    expect(result.totalWeaponAttack).toBe(145);
  });

  it('uses shadowPartner from base when present', () => {
    const nlBase: ClassBase = { ...classBase, shadowPartner: true };
    const result = mergeGearTemplate(nlBase, tierOverride, tierDefaults['high']);
    expect(result.shadowPartner).toBe(true);
  });

  it('tier override fields take precedence over base', () => {
    const overrideWithProjectile: TierOverride = { ...tierOverride, projectile: 30 };
    const result = mergeGearTemplate(classBase, overrideWithProjectile, tierDefaults['high']);
    expect(result.projectile).toBe(30);
  });
});
