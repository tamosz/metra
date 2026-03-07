import { describe, it, expect, beforeAll } from 'vitest';
import { loadMW, loadClassSkills } from '../data/loader.js';
import type { MWData, ClassSkillData, CharacterBuild } from '@metra/engine';
import {
  applyMW,
  calculateEcho,
  calculateMageEcho,
  calculateTotalAttack,
  calculateTotalStats,
} from '@metra/engine';

let mwData: MWData;
let heroData: ClassSkillData;

beforeAll(() => {
  mwData = loadMW();
  heroData = loadClassSkills('Hero');
});

describe('applyMW', () => {
  it('MW0 does not change stats', () => {
    expect(applyMW(999, mwData, 0)).toBe(999);
  });

  it('MW20 applies 1.10 multiplier with floor', () => {
    // floor(999 * 1.10) = floor(1098.9) = 1098
    expect(applyMW(999, mwData, 20)).toBe(1098);
    // floor(23 * 1.10) = floor(25.3) = 25
    expect(applyMW(23, mwData, 20)).toBe(25);
  });

});

describe('calculateEcho', () => {
  it('computes 4% of total WATK with floor (Hero High)', () => {
    // floor((214 + 100 + 0) * 0.04) = floor(12.56) = 12
    expect(calculateEcho(214, 100, 0)).toBe(12);
  });

  it('computes echo for Hero Low', () => {
    // floor((178 + 60 + 0) * 0.04) = floor(9.52) = 9
    expect(calculateEcho(178, 60, 0)).toBe(9);
  });
});

describe('calculateTotalAttack', () => {
  it('sums WATK + potion + projectile + echo (Hero High)', () => {
    const build = makeBuild({ totalWeaponAttack: 214, attackPotion: 100 });
    // 214 + 100 + 0 + 12 = 326
    expect(calculateTotalAttack(build)).toBe(326);
  });

  it('sums correctly for Hero Low', () => {
    const build = makeBuild({ totalWeaponAttack: 178, attackPotion: 60 });
    // 178 + 60 + 0 + 9 = 247
    expect(calculateTotalAttack(build)).toBe(247);
  });
});

describe('calculateTotalStats', () => {
  it('computes total STR/DEX for Hero High with MW20', () => {
    const build = makeBuild({
      baseStats: { STR: 999, DEX: 23, INT: 4, LUK: 4 },
      gearStats: { STR: 174, DEX: 102, INT: 0, LUK: 0 },
    });
    const stats = calculateTotalStats(build, heroData, mwData);
    // STR: 174 + floor(999 * 1.10) = 174 + 1098 = 1272
    expect(stats.primary).toBe(1272);
    // DEX: 102 + floor(23 * 1.10) = 102 + 25 = 127
    expect(stats.secondary).toBe(127);
  });

  it('computes total STR/DEX for Hero Low with MW20', () => {
    const build = makeBuild({
      baseStats: { STR: 700, DEX: 22, INT: 4, LUK: 4 },
      gearStats: { STR: 107, DEX: 96, INT: 0, LUK: 0 },
    });
    const stats = calculateTotalStats(build, heroData, mwData);
    // STR: 107 + floor(700 * 1.10) = 107 + 770 = 877
    expect(stats.primary).toBe(877);
    // DEX: 96 + floor(22 * 1.10) = 96 + 24 = 120
    expect(stats.secondary).toBe(120);
  });
});

describe('calculateTotalStats with array secondaryStat', () => {
  let shadData: ClassSkillData;

  beforeAll(() => {
    shadData = loadClassSkills('Shadower');
  });

  it('sums multiple secondary stats (STR + DEX) for Shadower', () => {
    const build = makeBuild({
      className: 'Shadower',
      baseStats: { STR: 4, DEX: 14, INT: 4, LUK: 933 },
      gearStats: { STR: 78, DEX: 135, INT: 0, LUK: 135 },
    });
    const stats = calculateTotalStats(build, shadData, mwData);

    // primary = LUK: floor(933 * 1.1) + 135 = 1026 + 135 = 1161
    expect(stats.primary).toBe(1161);
    // secondary = STR: (floor(4 * 1.1) + 78) + DEX: (floor(14 * 1.1) + 135)
    //           = (4 + 78) + (15 + 135) = 82 + 150 = 232
    expect(stats.secondary).toBe(232);
  });
});

describe('calculateMageEcho', () => {
  it('computes 4% of (INT + MATK + potion) with floor', () => {
    // floor((1000 + 500 + 100) * 0.04) = floor(1600 * 0.04) = floor(64) = 64
    expect(calculateMageEcho(1000, 500, 100)).toBe(64);
  });

  it('computes correctly for high stats', () => {
    // floor((1500 + 800 + 100) * 0.04) = floor(2400 * 0.04) = floor(96) = 96
    expect(calculateMageEcho(1500, 800, 100)).toBe(96);
  });

  it('floors the result for non-integer outputs', () => {
    // floor((1000 + 500 + 1) * 0.04) = floor(1501 * 0.04) = floor(60.04) = 60
    expect(calculateMageEcho(1000, 500, 1)).toBe(60);
  });

  it('returns 0 for zero inputs', () => {
    expect(calculateMageEcho(0, 0, 0)).toBe(0);
  });
});

function makeBuild(overrides: Partial<CharacterBuild> = {}): CharacterBuild {
  return {
    className: 'Hero',
    baseStats: { STR: 999, DEX: 23, INT: 4, LUK: 4 },
    gearStats: { STR: 174, DEX: 102, INT: 0, LUK: 0 },
    totalWeaponAttack: 214,
    weaponType: '2H Sword',
    weaponSpeed: 6,
    attackPotion: 100,
    projectile: 0,
    echoActive: true,
    mwLevel: 20,
    speedInfusion: true,
    sharpEyes: true,
    ...overrides,
  };
}
