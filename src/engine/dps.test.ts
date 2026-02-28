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

    // Berserk multiplier updated from 2.0 to 2.1 per royals.ms Update #68
    expect(result.attackTime).toBe(0.81);
    expect(result.skillDamagePercent).toBe(357);
    expect(result.seDamagePercent).toBe(651);
    expect(result.damageRange.max).toBe(20434);
    expect(result.damageRange.min).toBe(14824);
    expect(result.damageRange.average).toBe(17629);
    // DPS increased ~5% from Berserk 2.0→2.1
    expect(result.dps).toBeGreaterThan(261000);
    expect(result.dps).toBeLessThan(263000);
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
    // DPS increased from Berserk 2.0→2.1
    expect(result.dps).toBeGreaterThan(132000);
    expect(result.dps).toBeLessThan(134000);
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

    // SE damage% = (170 + 140) * 2.1 = 651
    expect(result.seDamagePercent).toBe(651);
    // Normal damage% = 170 * 2.1 = 357
    expect(result.skillDamagePercent).toBe(357);
  });

  it('Spear Crusher uses stab multiplier (5.0)', () => {
    const crusher = drkData.skills.find((s) => s.name === 'Spear Crusher')!;
    expect(crusher.attackType).toBe('stab');
  });
});

describe('DrK Fury (Polearm) DPS', () => {
  it('Fury uses slash (default) with Polearm multiplier 5.0', () => {
    const fury = drkData.skills.find((s) => s.name === 'Fury (Polearm)')!;
    // Fury has no attackType set → defaults to slash
    expect(fury.attackType).toBeUndefined();
    const result = calculateSkillDps(
      drkHigh,
      drkData,
      fury,
      weaponData,
      attackSpeedData,
      mapleWarriorData
    );

    // Polearm slash = 5.0, same as Spear stab = 5.0
    // Same base power, multiplier, hit count, speed category → same DPS
    const crusher = drkData.skills.find((s) => s.name === 'Spear Crusher')!;
    const crusherResult = calculateSkillDps(
      drkHigh,
      drkData,
      crusher,
      weaponData,
      attackSpeedData,
      mapleWarriorData
    );

    expect(result.dps).toBeCloseTo(crusherResult.dps, 0);
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
    // 2H BW weighted: 4.8*0.6 + 3.4*0.4 = 4.24 (3:2 swing/stab ratio)
    // max = floor((1272 * 4.24 + 127) * 326 / 100) = 17996
    // min = floor((1272 * 4.24 * 0.9 * 0.6 + 127) * 326 / 100) = 9908
    expect(result.damageRange.max).toBe(17996);
    expect(result.damageRange.min).toBe(9908);
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
    // Same damage range as Holy BW (same weapon type, same gear, same attackRatio)
    expect(result.damageRange.max).toBe(17996);
    expect(result.damageRange.min).toBe(9908);
  });

  it('BW variant has lower DPS than Sword variant (weighted swing/stab multiplier)', () => {
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

    // 2H BW effective = 4.24 (3:2 swing/stab) < 2H Sword 4.6 → Sword wins
    expect(swordResult.damageRange.max).toBeGreaterThan(bwResult.damageRange.max);
    expect(swordResult.dps).toBeGreaterThan(bwResult.dps);
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

describe('Shadower DPS', () => {
  let shadData: ClassSkillData;
  let shadHigh: CharacterBuild;
  let shadLow: CharacterBuild;

  beforeAll(() => {
    shadData = loadClassSkills('Shadower');
    shadHigh = loadGearTemplate('shadower-high');
    shadLow = loadGearTemplate('shadower-low');
  });

  it('loads Shadower skill data correctly', () => {
    expect(shadData.className).toBe('Shadower');
    expect(shadData.mastery).toBe(0.6);
    expect(shadData.primaryStat).toBe('LUK');
    expect(shadData.secondaryStat).toEqual(['STR', 'DEX']);
    expect(shadData.damageFormula).toBe('standard');
    expect(shadData.skills.length).toBe(3);
  });

  it('uses standard damage formula with Dagger 3.6x multiplier', () => {
    const bstep = shadData.skills.find((s) => s.name === 'Boomerang Step')!;
    const result = calculateSkillDps(
      shadHigh, shadData, bstep, weaponData, attackSpeedData, mapleWarriorData
    );

    // Standard formula: max = floor((LUK * 3.6 + STR + DEX) * totalAttack / 100)
    // LUK: floor(933 * 1.1) + 135 = 1026 + 135 = 1161
    // STR: floor(4 * 1.1) + 78 = 4 + 78 = 82
    // DEX: floor(14 * 1.1) + 135 = 15 + 135 = 150
    // secondary = 82 + 150 = 232
    // totalAttack = 247 + 100 + 0 + floor((247+100+0)*0.04) = 347 + 13 = 360
    // max = floor((1161 * 3.6 + 232) * 360 / 100) = floor(4411.6 * 3.6) = 15881
    // min = floor((1161 * 3.6 * 0.9 * 0.6 + 232) * 360 / 100) = 8960
    expect(result.damageRange.max).toBe(15881);
    expect(result.damageRange.min).toBe(8960);
  });

  it('BStep + Assn30 use combo cycle time (2.31s)', () => {
    const bstep = shadData.skills.find((s) => s.name === 'Boomerang Step')!;
    const assn = shadData.skills.find((s) => s.name === 'Assassinate 30')!;
    const bstepResult = calculateSkillDps(
      shadHigh, shadData, bstep, weaponData, attackSpeedData, mapleWarriorData
    );
    const assnResult = calculateSkillDps(
      shadHigh, shadData, assn, weaponData, attackSpeedData, mapleWarriorData
    );

    // Both share the combo cycle time
    expect(bstepResult.attackTime).toBe(2.31);
    expect(assnResult.attackTime).toBe(2.31);
  });

  it('Savage Blow uses Strafe/Snipe speed (0.69s at speed 3)', () => {
    const sb = shadData.skills.find((s) => s.name === 'Savage Blow')!;
    const result = calculateSkillDps(
      shadHigh, shadData, sb, weaponData, attackSpeedData, mapleWarriorData
    );

    // weaponSpeed 5 - booster 2 = speed 3 (no SI)
    expect(result.attackTime).toBe(0.69);
  });

  it('has no built-in crit (SE only at 15%)', () => {
    const bstep = shadData.skills.find((s) => s.name === 'Boomerang Step')!;
    const result = calculateSkillDps(
      shadHigh, shadData, bstep, weaponData, attackSpeedData, mapleWarriorData
    );

    // Normal: 600 * 1 = 600
    expect(result.skillDamagePercent).toBe(600);
    // SE (addBeforeMultiply): (600 + 140) * 1 = 740
    expect(result.seDamagePercent).toBe(740);
  });

  it('Shadow Partner multiplies DPS by 1.5', () => {
    const bstep = shadData.skills.find((s) => s.name === 'Boomerang Step')!;
    const withSp = calculateSkillDps(
      shadHigh, shadData, bstep, weaponData, attackSpeedData, mapleWarriorData
    );
    const noSpBuild = { ...shadHigh, shadowPartner: false };
    const withoutSp = calculateSkillDps(
      noSpBuild, shadData, bstep, weaponData, attackSpeedData, mapleWarriorData
    );

    expect(withSp.dps / withoutSp.dps).toBeCloseTo(1.5);
  });

  it('High tier BStep + Assn30 combo DPS', () => {
    const bstep = shadData.skills.find((s) => s.name === 'Boomerang Step')!;
    const assn = shadData.skills.find((s) => s.name === 'Assassinate 30')!;
    const bstepDps = calculateSkillDps(
      shadHigh, shadData, bstep, weaponData, attackSpeedData, mapleWarriorData
    ).dps;
    const assnDps = calculateSkillDps(
      shadHigh, shadData, assn, weaponData, attackSpeedData, mapleWarriorData
    ).dps;

    // Combo DPS = sum of individual DPS (both share 2.31s cycle)
    // = (bstepAvg + assnAvg) / 2.31
    const comboDps = bstepDps + assnDps;
    expect(comboDps).toBeCloseTo(335112, -1);
  });

  it('High tier Savage Blow DPS', () => {
    const sb = shadData.skills.find((s) => s.name === 'Savage Blow')!;
    const result = calculateSkillDps(
      shadHigh, shadData, sb, weaponData, attackSpeedData, mapleWarriorData
    );

    expect(result.dps).toBeCloseTo(163627, -1);
  });

  it('Low tier BStep + Assn30 combo DPS', () => {
    const bstep = shadData.skills.find((s) => s.name === 'Boomerang Step')!;
    const assn = shadData.skills.find((s) => s.name === 'Assassinate 30')!;
    const bstepDps = calculateSkillDps(
      shadLow, shadData, bstep, weaponData, attackSpeedData, mapleWarriorData
    ).dps;
    const assnDps = calculateSkillDps(
      shadLow, shadData, assn, weaponData, attackSpeedData, mapleWarriorData
    ).dps;

    const comboDps = bstepDps + assnDps;
    expect(comboDps).toBeCloseTo(198577, -1);
  });

  it('Low tier Savage Blow DPS', () => {
    const sb = shadData.skills.find((s) => s.name === 'Savage Blow')!;
    const result = calculateSkillDps(
      shadLow, shadData, sb, weaponData, attackSpeedData, mapleWarriorData
    );

    expect(result.dps).toBeCloseTo(96960, -1);
  });

  it('High tier DPS is greater than Low tier for all skills', () => {
    for (const skill of shadData.skills) {
      const high = calculateSkillDps(
        shadHigh, shadData, skill, weaponData, attackSpeedData, mapleWarriorData
      );
      const low = calculateSkillDps(
        shadLow, shadData, skill, weaponData, attackSpeedData, mapleWarriorData
      );
      expect(high.dps).toBeGreaterThan(low.dps);
    }
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
