import { describe, it, expect, beforeAll } from 'vitest';
import { loadMapleWarrior, loadClassSkills } from '../data/loader.js';
import type { MapleWarriorData, ClassSkillData, CharacterBuild } from '../data/types.js';
import {
  applyMapleWarrior,
  calculateEcho,
  calculateTotalAttack,
  calculateTotalStats,
} from './buffs.js';

let mwData: MapleWarriorData;
let heroData: ClassSkillData;

beforeAll(() => {
  mwData = loadMapleWarrior();
  heroData = loadClassSkills('Hero');
});

describe('applyMapleWarrior', () => {
  it('MW0 does not change stats', () => {
    expect(applyMapleWarrior(999, mwData, 0)).toBe(999);
  });

  it('MW20 applies 1.10 multiplier with floor', () => {
    // floor(999 * 1.10) = floor(1098.9) = 1098
    expect(applyMapleWarrior(999, mwData, 20)).toBe(1098);
    // floor(23 * 1.10) = floor(25.3) = 25
    expect(applyMapleWarrior(23, mwData, 20)).toBe(25);
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
    mapleWarriorLevel: 20,
    speedInfusion: true,
    sharpEyes: true,
    ...overrides,
  };
}
