import { describe, it, expect } from 'vitest';
import { computeBuild, type ClassBase } from './gear-compute.js';

const hero: ClassBase = {
  className: 'Hero',
  category: 'physical',
  primaryStat: 'STR',
  secondaryStat: 'DEX',
  weaponType: '2H Sword',
  weaponSpeed: 6,
  godlyCleanWATK: 115,
  weaponStat: 21,
  projectile: 0,
  echoActive: true,
  mwLevel: 20,
  speedInfusion: true,
  sharpEyes: true,
};

const shadower: ClassBase = {
  className: 'Shadower',
  category: 'physical',
  primaryStat: 'LUK',
  secondaryStat: ['STR', 'DEX'],
  weaponType: 'Dagger',
  weaponSpeed: 4,
  godlyCleanWATK: 110,
  weaponStat: 21,
  shieldWATK: 43,
  shieldStats: { LUK: 8, STR: 14 },
  projectile: 0,
  echoActive: true,
  mwLevel: 20,
  speedInfusion: true,
  sharpEyes: true,
  shadowPartner: false,
};

const bowmaster: ClassBase = {
  className: 'Bowmaster',
  category: 'physical',
  primaryStat: 'DEX',
  secondaryStat: 'STR',
  weaponType: 'Bow',
  weaponSpeed: 6,
  godlyCleanWATK: 110,
  weaponStat: 15,
  passiveWATK: 10,
  projectile: 10,
  echoActive: true,
  mwLevel: 20,
  speedInfusion: true,
  sharpEyes: true,
};

const nightLord: ClassBase = {
  className: 'Night Lord',
  category: 'physical',
  primaryStat: 'LUK',
  secondaryStat: 'DEX',
  weaponType: 'Claw',
  weaponSpeed: 4,
  godlyCleanWATK: 60,
  weaponStat: 20,
  baseSecondaryOverride: 25,
  projectile: 30,
  echoActive: true,
  mwLevel: 20,
  speedInfusion: true,
  sharpEyes: true,
  shadowPartner: true,
};

describe('computeBuild', () => {
  describe('Hero', () => {
    const build = computeBuild(hero);

    it('totalWeaponAttack = godlyClean + scrollBonus + nonWeaponWATK', () => {
      // 115 + 35 + 84 = 234
      expect(build.totalWeaponAttack).toBe(234);
    });

    it('gearStats primary = gearPrimary + weaponStat', () => {
      // STR = 295 + 21 = 316
      expect(build.gearStats.STR).toBe(316);
    });

    it('gearStats secondary = gearSecondary', () => {
      expect(build.gearStats.DEX).toBe(168);
    });

    it('baseStats primary = basePrimary', () => {
      expect(build.baseStats.STR).toBe(999);
    });

    it('baseStats secondary = baseSecondary', () => {
      expect(build.baseStats.DEX).toBe(23);
    });

    it('non-used stats are 4', () => {
      expect(build.baseStats.INT).toBe(4);
      expect(build.baseStats.LUK).toBe(4);
      expect(build.gearStats.INT).toBe(0);
      expect(build.gearStats.LUK).toBe(0);
    });

    it('passes through class fields', () => {
      expect(build.className).toBe('Hero');
      expect(build.weaponType).toBe('2H Sword');
      expect(build.weaponSpeed).toBe(6);
      expect(build.projectile).toBe(0);
      expect(build.echoActive).toBe(true);
      expect(build.mwLevel).toBe(20);
      expect(build.speedInfusion).toBe(true);
      expect(build.sharpEyes).toBe(true);
      expect(build.attackPotion).toBe(140);
    });
  });

  describe('Shadower', () => {
    const build = computeBuild(shadower);

    it('totalWeaponAttack includes shieldWATK', () => {
      // 110 + 35 + 84 + 43 = 272
      expect(build.totalWeaponAttack).toBe(272);
    });

    it('gearStats primary includes weaponStat + shieldStats', () => {
      // LUK = 295 + 21 + 8 = 324
      expect(build.gearStats.LUK).toBe(324);
    });

    it('gearStats first secondary includes shieldStats', () => {
      // STR = 168 (gearSecondary) + 14 (shield) = 182
      expect(build.gearStats.STR).toBe(182);
    });

    it('gearStats second secondary gets gearSecondary', () => {
      // DEX = 168 (gearSecondary from all-stat gear)
      expect(build.gearStats.DEX).toBe(168);
    });

    it('baseStats for both secondaries', () => {
      expect(build.baseStats.STR).toBe(23);
      expect(build.baseStats.DEX).toBe(23);
    });

    it('shadowPartner is passed through', () => {
      expect(build.shadowPartner).toBe(false);
    });
  });

  describe('Bowmaster', () => {
    const build = computeBuild(bowmaster);

    it('totalWeaponAttack includes passiveWATK', () => {
      // 110 + 35 + 84 + 10 = 239
      expect(build.totalWeaponAttack).toBe(239);
    });

    it('primary stat is DEX', () => {
      expect(build.gearStats.DEX).toBe(295 + 15);
      expect(build.baseStats.DEX).toBe(999);
    });

    it('secondary stat is STR', () => {
      expect(build.gearStats.STR).toBe(168);
      expect(build.baseStats.STR).toBe(23);
    });

    it('projectile is passed through', () => {
      expect(build.projectile).toBe(10);
    });
  });

  describe('Night Lord', () => {
    const build = computeBuild(nightLord);

    it('primary stat is LUK', () => {
      expect(build.gearStats.LUK).toBe(295 + 20);
      expect(build.baseStats.LUK).toBe(999);
    });

    it('secondary stat is DEX with override', () => {
      expect(build.gearStats.DEX).toBe(168);
      expect(build.baseStats.DEX).toBe(25);
    });

    it('shadowPartner is true', () => {
      expect(build.shadowPartner).toBe(true);
    });

    it('projectile is 30', () => {
      expect(build.projectile).toBe(30);
    });
  });
});
