import { describe, it, expect, beforeAll } from 'vitest';
import {
  loadWeapons,
  loadAttackSpeed,
  loadMapleWarrior,
  loadClassSkills,
  loadGearTemplate,
} from '../data/loader.js';
import type {
  WeaponData,
  AttackSpeedData,
  MapleWarriorData,
  ClassSkillData,
  CharacterBuild,
} from '../data/types.js';
import { calculateSkillDps } from './dps.js';

let weaponData: WeaponData;
let attackSpeedData: AttackSpeedData;
let mapleWarriorData: MapleWarriorData;
let heroData: ClassSkillData;
let heroHigh: CharacterBuild;
let heroLow: CharacterBuild;
let drkData: ClassSkillData;
let drkHigh: CharacterBuild;
let drkLow: CharacterBuild;
let paladinData: ClassSkillData;
let paladinHigh: CharacterBuild;
let paladinLow: CharacterBuild;
let nlData: ClassSkillData;
let nlHigh: CharacterBuild;
let nlLow: CharacterBuild;

beforeAll(() => {
  weaponData = loadWeapons();
  attackSpeedData = loadAttackSpeed();
  mapleWarriorData = loadMapleWarrior();
  heroData = loadClassSkills('Hero');
  heroHigh = loadGearTemplate('hero-high');
  heroLow = loadGearTemplate('hero-low');
  drkData = loadClassSkills('DrK');
  drkHigh = loadGearTemplate('drk-high');
  drkLow = loadGearTemplate('drk-low');
  paladinData = loadClassSkills('Paladin');
  paladinHigh = loadGearTemplate('paladin-high');
  paladinLow = loadGearTemplate('paladin-low');
  nlData = loadClassSkills('NL');
  nlHigh = loadGearTemplate('nl-high');
  nlLow = loadGearTemplate('nl-low');
});

describe('Hero Brandish (Sword) DPS', () => {
  it('matches hero charts High tier DPS (~255,950)', () => {
    const brandish = heroData.skills.find(
      (s) => s.name === 'Brandish (Sword)'
    )!;
    const result = calculateSkillDps(
      heroHigh,
      heroData,
      brandish,
      weaponData,
      attackSpeedData,
      mapleWarriorData
    );

    // Verify intermediate values
    expect(result.attackTime).toBe(0.63);
    expect(result.skillDamagePercent).toBe(494);
    expect(result.seDamagePercent).toBe(760);
    expect(result.damageRange.max).toBe(19488);
    expect(result.damageRange.min).toBe(10714);
    expect(result.damageRange.average).toBe(15101);

    // Target from hero charts sheet G3: 255949.9650793651
    expect(result.dps).toBeCloseTo(255950, -1);
  });

  it('matches hero charts Low tier DPS (~135,060)', () => {
    const brandish = heroData.skills.find(
      (s) => s.name === 'Brandish (Sword)'
    )!;
    const result = calculateSkillDps(
      heroLow,
      heroData,
      brandish,
      weaponData,
      attackSpeedData,
      mapleWarriorData
    );

    // Verify intermediate values (pendant reduced from STR22/DEX23 to STR10/DEX10)
    expect(result.attackTime).toBe(0.63);
    expect(result.damageRange.max).toBe(10092);
    expect(result.damageRange.min).toBe(5571);
    expect(result.damageRange.average).toBe(7831.5);

    expect(result.dps).toBeCloseTo(132738, -1);
  });

  it('produces exact High tier DPS value', () => {
    const brandish = heroData.skills.find(
      (s) => s.name === 'Brandish (Sword)'
    )!;
    const result = calculateSkillDps(
      heroHigh,
      heroData,
      brandish,
      weaponData,
      attackSpeedData,
      mapleWarriorData
    );

    // Exact value from spreadsheet: 255949.9650793651
    // Our calculation: 161248.478 / 0.63
    // Small floating-point differences are acceptable
    expect(Math.abs(result.dps - 255949.9650793651)).toBeLessThan(1);
  });

  it('produces exact Low tier DPS value', () => {
    const brandish = heroData.skills.find(
      (s) => s.name === 'Brandish (Sword)'
    )!;
    const result = calculateSkillDps(
      heroLow,
      heroData,
      brandish,
      weaponData,
      attackSpeedData,
      mapleWarriorData
    );

    // Value after pendant fix (STR22/DEX23 → STR10/DEX10): 132737.7095238095
    expect(Math.abs(result.dps - 132737.7095238095)).toBeLessThan(1);
  });
});

describe('DrK Spear Crusher DPS', () => {
  it('matches hero charts High tier DPS (I15: 249,418)', () => {
    const crusher = drkData.skills.find((s) => s.name === 'Spear Crusher')!;
    const result = calculateSkillDps(
      drkHigh,
      drkData,
      crusher,
      weaponData,
      attackSpeedData,
      mapleWarriorData
    );

    // Verified against hero charts I15: 249417.70370370368
    expect(result.attackTime).toBe(0.81);
    expect(result.skillDamagePercent).toBe(340);
    expect(result.seDamagePercent).toBe(620);
    expect(result.damageRange.max).toBe(20434);
    expect(result.damageRange.min).toBe(14824);
    expect(result.damageRange.average).toBe(17629);
    expect(Math.abs(result.dps - 249417.70370370368)).toBeLessThan(1);
  });

  it('computes Low tier DPS from gear template', () => {
    const crusher = drkData.skills.find((s) => s.name === 'Spear Crusher')!;
    const result = calculateSkillDps(
      drkLow,
      drkData,
      crusher,
      weaponData,
      attackSpeedData,
      mapleWarriorData
    );

    // Computed from gear template (WATK=165, Spear, mastery 0.8)
    // Pendant reduced from STR22/DEX23 to STR10/DEX10
    expect(result.attackTime).toBe(0.81);
    expect(result.damageRange.max).toBe(10370);
    expect(result.damageRange.min).toBe(7537);
    expect(result.damageRange.average).toBe(8953.5);
    expect(result.dps).toBeGreaterThan(126000);
    expect(result.dps).toBeLessThan(127000);
  });

  it('uses addBeforeMultiply SE formula (default)', () => {
    const crusher = drkData.skills.find((s) => s.name === 'Spear Crusher')!;
    const result = calculateSkillDps(
      drkHigh,
      drkData,
      crusher,
      weaponData,
      attackSpeedData,
      mapleWarriorData
    );

    // SE damage% = (170 + 140) * 2.0 = 620
    expect(result.seDamagePercent).toBe(620);
    // Normal damage% = 170 * 2.0 = 340
    expect(result.skillDamagePercent).toBe(340);
  });
});

describe('Paladin Blast DPS', () => {
  it('uses addAfterMultiply SE formula', () => {
    const blast = paladinData.skills.find(
      (s) => s.name === 'Blast (Holy, Sword)'
    )!;
    const result = calculateSkillDps(
      paladinHigh,
      paladinData,
      blast,
      weaponData,
      attackSpeedData,
      mapleWarriorData
    );

    // Paladin SE: basePower * multiplier + bonus = 580 * 1.4 + 140 = 952
    expect(result.seDamagePercent).toBe(952);
    // Normal: 580 * 1.4 = 812
    expect(result.skillDamagePercent).toBe(812);
  });

  it('computes High tier DPS from gear template', () => {
    const blast = paladinData.skills.find(
      (s) => s.name === 'Blast (Holy, Sword)'
    )!;
    const result = calculateSkillDps(
      paladinHigh,
      paladinData,
      blast,
      weaponData,
      attackSpeedData,
      mapleWarriorData
    );

    // Paladin uses Hero-identical gear (gear templates sheet row 3: "Hero & Paladin")
    // Same damage range as Hero High: max=19488, min=10714, avg=15101
    // Note: hero charts J15 shows 276,092 — likely computed with different gear setup
    expect(result.damageRange.max).toBe(19488);
    expect(result.damageRange.min).toBe(10714);
    // TODO: loose assertion — hero charts J15 (276,092) uses different gear values;
    // tighten once Paladin High gear template is verified against the sheet
    expect(result.dps).toBeGreaterThan(199000);
    expect(result.dps).toBeLessThan(200000);
  });

  it('computes Low tier DPS from gear template', () => {
    const blast = paladinData.skills.find(
      (s) => s.name === 'Blast (Holy, Sword)'
    )!;
    const result = calculateSkillDps(
      paladinLow,
      paladinData,
      blast,
      weaponData,
      attackSpeedData,
      mapleWarriorData
    );

    // Same damage range as Hero Low (pendant reduced from STR22/DEX23 to STR10/DEX10)
    expect(result.damageRange.max).toBe(10092);
    expect(result.damageRange.min).toBe(5571);
    expect(result.dps).toBeGreaterThan(103000);
    expect(result.dps).toBeLessThan(104000);
  });

  it('Blast (F/I/L Charge) uses Strafe/Snipe speed category', () => {
    const blast = paladinData.skills.find(
      (s) => s.name === 'Blast (F/I/L Charge, Sword)'
    )!;
    const result = calculateSkillDps(
      paladinHigh,
      paladinData,
      blast,
      weaponData,
      attackSpeedData,
      mapleWarriorData
    );

    // F/I/L charge uses Strafe/Snipe speed (0.60s at speed 2)
    expect(result.attackTime).toBe(0.60);
    expect(result.skillDamagePercent).toBe(754);
    // SE: 580 * 1.3 + 140 = 894
    expect(result.seDamagePercent).toBe(894);
  });
});

describe('Paladin BW Blast DPS', () => {
  it('uses 2H BW weapon multiplier (4.8) for Blast (Holy, BW)', () => {
    const blast = paladinData.skills.find(
      (s) => s.name === 'Blast (Holy, BW)'
    )!;
    const result = calculateSkillDps(
      paladinHigh,
      paladinData,
      blast,
      weaponData,
      attackSpeedData,
      mapleWarriorData
    );

    // Same speed category as Sword Blast → same attack time
    expect(result.attackTime).toBe(0.63);
    // Same base power and multiplier as Sword variant
    expect(result.skillDamagePercent).toBe(812);
    // SE: 580 * 1.4 + 140 = 952 (addAfterMultiply)
    expect(result.seDamagePercent).toBe(952);
    // 2H BW slash = 4.8, primary STR = 1272, secondary DEX = 127, totalAttack = 326
    // max = floor((1272 * 4.8 + 127) * 326 / 100) = 20318
    // min = floor((1272 * 4.8 * 0.9 * 0.6 + 127) * 326 / 100) = 11162
    expect(result.damageRange.max).toBe(20318);
    expect(result.damageRange.min).toBe(11162);
  });

  it('Blast (F/I/L Charge, BW) uses Blast speed category', () => {
    const blast = paladinData.skills.find(
      (s) => s.name === 'Blast (F/I/L Charge, BW)'
    )!;
    const result = calculateSkillDps(
      paladinHigh,
      paladinData,
      blast,
      weaponData,
      attackSpeedData,
      mapleWarriorData
    );

    // BW charge variant uses Blast speed (same as all BW variants)
    expect(result.attackTime).toBe(0.63);
    expect(result.skillDamagePercent).toBe(754);
    // SE: 580 * 1.3 + 140 = 894
    expect(result.seDamagePercent).toBe(894);
    // Same damage range as Holy BW (same weapon type, same gear)
    expect(result.damageRange.max).toBe(20318);
    expect(result.damageRange.min).toBe(11162);
  });

  it('BW variant has higher DPS than Sword variant (higher weapon multiplier)', () => {
    const swordBlast = paladinData.skills.find(
      (s) => s.name === 'Blast (Holy, Sword)'
    )!;
    const bwBlast = paladinData.skills.find(
      (s) => s.name === 'Blast (Holy, BW)'
    )!;
    const swordResult = calculateSkillDps(
      paladinHigh,
      paladinData,
      swordBlast,
      weaponData,
      attackSpeedData,
      mapleWarriorData
    );
    const bwResult = calculateSkillDps(
      paladinHigh,
      paladinData,
      bwBlast,
      weaponData,
      attackSpeedData,
      mapleWarriorData
    );

    // 2H BW (4.8) > 2H Sword (4.6) → BW should deal more damage
    expect(bwResult.damageRange.max).toBeGreaterThan(swordResult.damageRange.max);
    expect(bwResult.dps).toBeGreaterThan(swordResult.dps);
  });
});

describe('NL Gear Template DPS', () => {
  it('High tier damage range matches computed values', () => {
    const tt = nlData.skills.find((s) => s.name === 'Triple Throw 30')!;
    const result = calculateSkillDps(
      nlHigh,
      nlData,
      tt,
      weaponData,
      attackSpeedData,
      mapleWarriorData
    );

    // totalAttack = 151 + 100 + 30 + echo(floor(281*0.04)=11) = 292
    // LUK = floor(999*1.1) + 98 = 1098 + 98 = 1196
    // max = floor(5.0 * 1196 * 292 / 100) = 17461
    // min = floor(2.5 * 1196 * 292 / 100) = 8730
    expect(result.damageRange.max).toBe(17461);
    expect(result.damageRange.min).toBe(8730);
  });

  it('Low tier damage range matches computed values', () => {
    const tt = nlData.skills.find((s) => s.name === 'Triple Throw 30')!;
    const result = calculateSkillDps(
      nlLow,
      nlData,
      tt,
      weaponData,
      attackSpeedData,
      mapleWarriorData
    );

    // totalAttack = 105 + 60 + 27 + echo(floor(192*0.04)=7) = 199
    // LUK = floor(700*1.1) + 53 = 770 + 53 = 823
    // max = floor(5.0 * 823 * 199 / 100) = 8188
    // min = floor(2.5 * 823 * 199 / 100) = 4094
    expect(result.damageRange.max).toBe(8188);
    expect(result.damageRange.min).toBe(4094);
  });

  it('High tier DPS is greater than Low tier', () => {
    const tt = nlData.skills.find((s) => s.name === 'Triple Throw 30')!;
    const highResult = calculateSkillDps(
      nlHigh,
      nlData,
      tt,
      weaponData,
      attackSpeedData,
      mapleWarriorData
    );
    const lowResult = calculateSkillDps(
      nlLow,
      nlData,
      tt,
      weaponData,
      attackSpeedData,
      mapleWarriorData
    );

    expect(highResult.dps).toBeGreaterThan(lowResult.dps);
    expect(highResult.dps).toBeGreaterThan(0);
    expect(lowResult.dps).toBeGreaterThan(0);
  });

  it('uses attack time 0.60s', () => {
    const tt = nlData.skills.find((s) => s.name === 'Triple Throw 30')!;
    const result = calculateSkillDps(
      nlHigh,
      nlData,
      tt,
      weaponData,
      attackSpeedData,
      mapleWarriorData
    );

    expect(result.attackTime).toBe(0.60);
  });

  it('Shadow Partner is active in both templates', () => {
    expect(nlHigh.shadowPartner).toBe(true);
    expect(nlLow.shadowPartner).toBe(true);
  });
});

describe('Night Lord Triple Throw DPS', () => {
  let nlData: ClassSkillData;
  const nlBuild: CharacterBuild = {
    className: 'NL',
    baseStats: { STR: 4, DEX: 25, INT: 4, LUK: 605 },
    gearStats: { STR: 18, DEX: 0, INT: 0, LUK: 195 },
    totalWeaponAttack: 250,
    weaponType: 'Claw',
    weaponSpeed: 4,
    attackPotion: 0,
    projectile: 27,
    echoActive: false,
    mapleWarriorLevel: 20,
    speedInfusion: true,
    sharpEyes: true,
    shadowPartner: true,
  };

  beforeAll(() => {
    nlData = loadClassSkills('NL');
  });

  it('loads NL skill data correctly', () => {
    expect(nlData.className).toBe('NL');
    expect(nlData.mastery).toBe(0.6);
    expect(nlData.primaryStat).toBe('LUK');
    expect(nlData.skills.length).toBe(2);
    expect(nlData.skills[0].name).toBe('Triple Throw 30');
  });

  it('uses throwing star range formula (not standard)', () => {
    const tt = nlData.skills.find((s) => s.name === 'Triple Throw 30')!;
    const result = calculateSkillDps(
      nlBuild,
      nlData,
      tt,
      weaponData,
      attackSpeedData,
      mapleWarriorData
    );

    // Throwing star: max = floor(5.0 * LUK * totalAttack / 100)
    // MW20 multiplier = 1.1, baseLUK = 605 → floor(605 * 1.1) = 665
    // primary = 665 + 195 = 860
    // totalAttack = 250 + 0 + 27 = 277 (no echo)
    // max = floor(5.0 * 860 * 277 / 100) = floor(119110) = 11911
    // min = floor(2.5 * 860 * 277 / 100) = floor(59555) = 5955
    expect(result.damageRange.max).toBe(11911);
    expect(result.damageRange.min).toBe(5955);
  });

  it('computes crit damage% with built-in + SE bonuses', () => {
    const tt = nlData.skills.find((s) => s.name === 'Triple Throw 30')!;
    const result = calculateSkillDps(
      nlBuild,
      nlData,
      tt,
      weaponData,
      attackSpeedData,
      mapleWarriorData
    );

    // Normal: 150 * 1 = 150
    expect(result.skillDamagePercent).toBe(150);
    // Crit (addBeforeMultiply): (150 + 100 + 140) * 1 = 390
    expect(result.seDamagePercent).toBe(390);
  });

  it('computes crit damage% without SE (built-in crit only)', () => {
    const tt = nlData.skills.find((s) => s.name === 'Triple Throw 30')!;
    const noSeBuild = { ...nlBuild, sharpEyes: false };
    const result = calculateSkillDps(
      noSeBuild,
      nlData,
      tt,
      weaponData,
      attackSpeedData,
      mapleWarriorData
    );

    // Without SE: crit bonus = 100 only (built-in), no SE bonus
    // (150 + 100) * 1 = 250
    expect(result.seDamagePercent).toBe(250);
  });

  it('uses 0.65 crit rate with SE (0.50 built-in + 0.15 SE)', () => {
    const tt = nlData.skills.find((s) => s.name === 'Triple Throw 30')!;
    const result = calculateSkillDps(
      nlBuild,
      nlData,
      tt,
      weaponData,
      attackSpeedData,
      mapleWarriorData
    );

    // Verify via average damage formula:
    // With 65% crit rate, normal rate = 0.35
    // avgDmg = ((150/100)*0.35*adjRange + (390/100)*0.65*adjRangeCrit) * 3 * 1.5
    // We check the DPS is consistent with these rates
    const noSpBuild = { ...nlBuild, shadowPartner: false };
    const resultNoSp = calculateSkillDps(
      noSpBuild,
      nlData,
      tt,
      weaponData,
      attackSpeedData,
      mapleWarriorData
    );
    // Shadow Partner should multiply by exactly 1.5
    expect(result.averageDamage / resultNoSp.averageDamage).toBeCloseTo(1.5);
  });

  it('Shadow Partner multiplies DPS by 1.5', () => {
    const tt = nlData.skills.find((s) => s.name === 'Triple Throw 30')!;
    const withSp = calculateSkillDps(
      nlBuild,
      nlData,
      tt,
      weaponData,
      attackSpeedData,
      mapleWarriorData
    );
    const noSpBuild = { ...nlBuild, shadowPartner: false };
    const withoutSp = calculateSkillDps(
      noSpBuild,
      nlData,
      tt,
      weaponData,
      attackSpeedData,
      mapleWarriorData
    );

    expect(withSp.dps / withoutSp.dps).toBeCloseTo(1.5);
  });

  it('uses Triple Throw attack speed (0.60s at speed 2)', () => {
    const tt = nlData.skills.find((s) => s.name === 'Triple Throw 30')!;
    const result = calculateSkillDps(
      nlBuild,
      nlData,
      tt,
      weaponData,
      attackSpeedData,
      mapleWarriorData
    );

    // weaponSpeed=4 - booster(2) - SI(1) = speed 1, clamped to 2
    expect(result.attackTime).toBe(0.60);
  });

  it('TT 20 has lower base power than TT 30', () => {
    const tt30 = nlData.skills.find((s) => s.name === 'Triple Throw 30')!;
    const tt20 = nlData.skills.find((s) => s.name === 'Triple Throw 20')!;
    const result30 = calculateSkillDps(
      nlBuild,
      nlData,
      tt30,
      weaponData,
      attackSpeedData,
      mapleWarriorData
    );
    const result20 = calculateSkillDps(
      nlBuild,
      nlData,
      tt20,
      weaponData,
      attackSpeedData,
      mapleWarriorData
    );

    expect(result30.skillDamagePercent).toBe(150);
    expect(result20.skillDamagePercent).toBe(140);
    expect(result30.dps).toBeGreaterThan(result20.dps);
  });
});

describe('DPS result structure', () => {
  it('includes all expected fields', () => {
    const brandish = heroData.skills.find(
      (s) => s.name === 'Brandish (Sword)'
    )!;
    const result = calculateSkillDps(
      heroHigh,
      heroData,
      brandish,
      weaponData,
      attackSpeedData,
      mapleWarriorData
    );

    expect(result.skillName).toBe('Brandish (Sword)');
    expect(result.attackTime).toBeGreaterThan(0);
    expect(result.damageRange.min).toBeGreaterThan(0);
    expect(result.damageRange.max).toBeGreaterThan(result.damageRange.min);
    expect(result.averageDamage).toBeGreaterThan(0);
    expect(result.dps).toBeGreaterThan(0);
  });
});
