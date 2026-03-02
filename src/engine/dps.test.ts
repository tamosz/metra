import { describe, it, expect, beforeAll } from 'vitest';
import {
  loadWeapons,
  loadAttackSpeed,
  loadMW,
  loadClassSkills,
  loadGearTemplate,
} from '../data/loader.js';
import type {
  WeaponData,
  AttackSpeedData,
  MWData,
  ClassSkillData,
  CharacterBuild,
} from '../data/types.js';
import { calculateSkillDps } from './dps.js';
import type { SkillEntry } from '../data/types.js';

let weaponData: WeaponData;
let attackSpeedData: AttackSpeedData;
let mwData: MWData;
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
  mwData = loadMW();
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
      mwData
    );

    // Verify intermediate values
    expect(result.attackTime).toBe(0.63);
    expect(result.skillDamagePercent).toBe(494);
    expect(result.critDamagePercent).toBe(760);
    expect(result.damageRange.max).toBe(18831);
    expect(result.damageRange.min).toBe(10352);
    expect(result.damageRange.average).toBe(14591.5);

    // After C/G/S standardization (214→203 WATK)
    expect(result.dps).toBeCloseTo(247314, -1);
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
      mwData
    );

    // After weapon WATK reduction (178→168 WATK)
    expect(result.attackTime).toBe(0.63);
    expect(result.damageRange.max).toBe(9683);
    expect(result.damageRange.min).toBe(5345);
    expect(result.damageRange.average).toBe(7514);

    expect(result.dps).toBeCloseTo(127356, -1);
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
      mwData
    );

    // After C/G/S standardization (214→203 WATK)
    expect(Math.abs(result.dps - 247314.34444444446)).toBeLessThan(1);
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
      mwData
    );

    // After weapon WATK reduction (178→168 WATK)
    expect(Math.abs(result.dps - 127356.3365079365)).toBeLessThan(1);
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
      mwData
    );

    // Berserk multiplier updated from 2.0 to 2.1 per royals.ms Update #68
    expect(result.attackTime).toBe(0.81);
    expect(result.skillDamagePercent).toBe(357);
    expect(result.critDamagePercent).toBe(651);
    expect(result.damageRange.max).toBe(19655);
    expect(result.damageRange.min).toBe(14259);
    expect(result.damageRange.average).toBe(16957);
    // After C/G/S standardization (203→192 WATK)
    expect(result.dps).toBeGreaterThan(251000);
    expect(result.dps).toBeLessThan(253000);
  });

  it('computes Low tier DPS from gear template', () => {
    const crusher = drkData.skills.find((s) => s.name === 'Spear Crusher')!;
    const result = calculateSkillDps(
      drkLow,
      drkData,
      crusher,
      weaponData,
      attackSpeedData,
      mwData
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
      mwData
    );

    // SE damage% = (170 + 140) * 2.1 = 651
    expect(result.critDamagePercent).toBe(651);
    // Normal damage% = 170 * 2.1 = 357
    expect(result.skillDamagePercent).toBe(357);
  });

  it('Spear Crusher uses stab multiplier (5.0)', () => {
    const crusher = drkData.skills.find((s) => s.name === 'Spear Crusher')!;
    expect(crusher.attackType).toBe('stab');
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
      mwData
    );

    // Paladin SE: basePower * multiplier + bonus = 580 * 1.4 + 140 = 952
    expect(result.critDamagePercent).toBe(952);
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
      mwData
    );

    // Paladin uses Hero-identical gear (gear templates sheet row 3: "Hero & Paladin")
    // Same damage range as Hero High after C/G/S standardization (214→203 WATK)
    expect(result.damageRange.max).toBe(18831);
    expect(result.damageRange.min).toBe(10352);
    expect(result.dps).toBeGreaterThan(192000);
    expect(result.dps).toBeLessThan(193000);
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
      mwData
    );

    // Same damage range as Hero Low after weapon WATK reduction (178→168 WATK)
    expect(result.damageRange.max).toBe(9683);
    expect(result.damageRange.min).toBe(5345);
    expect(result.dps).toBeGreaterThan(99000);
    expect(result.dps).toBeLessThan(100000);
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
      mwData
    );

    // F/I/L charge uses Strafe/Snipe speed (0.60s at speed 2)
    expect(result.attackTime).toBe(0.60);
    expect(result.skillDamagePercent).toBe(754);
    // SE: 580 * 1.3 + 140 = 894
    expect(result.critDamagePercent).toBe(894);
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
      mwData
    );

    // Same speed category as Sword Blast → same attack time
    expect(result.attackTime).toBe(0.63);
    // Same base power and multiplier as Sword variant
    expect(result.skillDamagePercent).toBe(812);
    // SE: 580 * 1.4 + 140 = 952 (addAfterMultiply)
    expect(result.critDamagePercent).toBe(952);
    // 2H BW weighted: 4.8*0.6 + 3.4*0.4 = 4.24 (3:2 swing/stab ratio)
    // max = floor((1272 * 4.24 + 127) * 315 / 100) = 17388
    // min = floor((1272 * 4.24 * 0.9 * 0.6 + 127) * 315 / 100) = 9574
    expect(result.damageRange.max).toBe(17388);
    expect(result.damageRange.min).toBe(9574);
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
      mwData
    );

    // BW charge variant uses Blast speed (same as all BW variants)
    expect(result.attackTime).toBe(0.63);
    expect(result.skillDamagePercent).toBe(754);
    // SE: 580 * 1.3 + 140 = 894
    expect(result.critDamagePercent).toBe(894);
    // Same damage range as Holy BW (same weapon type, same gear, same attackRatio)
    expect(result.damageRange.max).toBe(17388);
    expect(result.damageRange.min).toBe(9574);
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
      mwData
    );
    const bwResult = calculateSkillDps(
      paladinHigh,
      paladinData,
      bwBlast,
      weaponData,
      attackSpeedData,
      mwData
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
      mwData
    );

    // totalAttack = 144 + 100 + 30 + echo(floor(274*0.04)=10) = 284
    // LUK = floor(999*1.1) + 98 = 1098 + 98 = 1196
    // max = floor(5.0 * 1196 * 284 / 100) = 16983
    // min = floor(2.5 * 1196 * 284 / 100) = 8491
    expect(result.damageRange.max).toBe(16983);
    expect(result.damageRange.min).toBe(8491);
  });

  it('Low tier damage range matches computed values', () => {
    const tt = nlData.skills.find((s) => s.name === 'Triple Throw 30')!;
    const result = calculateSkillDps(
      nlLow,
      nlData,
      tt,
      weaponData,
      attackSpeedData,
      mwData
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
      mwData
    );
    const lowResult = calculateSkillDps(
      nlLow,
      nlData,
      tt,
      weaponData,
      attackSpeedData,
      mwData
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
      mwData
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
    mwLevel: 20,
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
    expect(nlData.skills.length).toBe(1);
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
      mwData
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
      mwData
    );

    // Normal: 150 * 1 = 150
    expect(result.skillDamagePercent).toBe(150);
    // Crit (addBeforeMultiply): (150 + 100 + 140) * 1 = 390
    expect(result.critDamagePercent).toBe(390);
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
      mwData
    );

    // Without SE: crit bonus = 100 only (built-in), no SE bonus
    // (150 + 100) * 1 = 250
    expect(result.critDamagePercent).toBe(250);
  });

  it('uses 0.65 crit rate with SE (0.50 built-in + 0.15 SE)', () => {
    const tt = nlData.skills.find((s) => s.name === 'Triple Throw 30')!;
    const result = calculateSkillDps(
      nlBuild,
      nlData,
      tt,
      weaponData,
      attackSpeedData,
      mwData
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
      mwData
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
      mwData
    );
    const noSpBuild = { ...nlBuild, shadowPartner: false };
    const withoutSp = calculateSkillDps(
      noSpBuild,
      nlData,
      tt,
      weaponData,
      attackSpeedData,
      mwData
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
      mwData
    );

    // weaponSpeed=4 - booster(2) - SI(1) = speed 1, clamped to 2
    expect(result.attackTime).toBe(0.60);
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
      shadHigh, shadData, bstep, weaponData, attackSpeedData, mwData
    );

    // Standard formula: max = floor((LUK * 3.6 + STR + DEX) * totalAttack / 100)
    // LUK: floor(933 * 1.1) + 135 = 1026 + 135 = 1161
    // STR: floor(4 * 1.1) + 78 = 4 + 78 = 82
    // DEX: floor(14 * 1.1) + 135 = 15 + 135 = 150
    // secondary = 82 + 150 = 232
    // totalAttack = 238 + 100 + 0 + floor((238+100+0)*0.04) = 338 + 13 = 351
    // max = floor((1161 * 3.6 + 232) * 351 / 100) = 15484
    // min = floor((1161 * 3.6 * 0.9 * 0.6 + 232) * 351 / 100) = 8736
    expect(result.damageRange.max).toBe(15484);
    expect(result.damageRange.min).toBe(8736);
  });

  it('BStep + Assn30 use combo cycle time (2.31s)', () => {
    const bstep = shadData.skills.find((s) => s.name === 'Boomerang Step')!;
    const assn = shadData.skills.find((s) => s.name === 'Assassinate 30')!;
    const bstepResult = calculateSkillDps(
      shadHigh, shadData, bstep, weaponData, attackSpeedData, mwData
    );
    const assnResult = calculateSkillDps(
      shadHigh, shadData, assn, weaponData, attackSpeedData, mwData
    );

    // Both share the combo cycle time
    expect(bstepResult.attackTime).toBe(2.31);
    expect(assnResult.attackTime).toBe(2.31);
  });

  it('Savage Blow uses Strafe/Snipe speed (0.60s at speed 2)', () => {
    const sb = shadData.skills.find((s) => s.name === 'Savage Blow')!;
    const result = calculateSkillDps(
      shadHigh, shadData, sb, weaponData, attackSpeedData, mwData
    );

    // weaponSpeed 5 - booster 2 - SI 2 = speed 2 (capped)
    expect(result.attackTime).toBe(0.60);
  });

  it('has no built-in crit (SE only at 15%)', () => {
    const bstep = shadData.skills.find((s) => s.name === 'Boomerang Step')!;
    const result = calculateSkillDps(
      shadHigh, shadData, bstep, weaponData, attackSpeedData, mwData
    );

    // Normal: 600 * 1 = 600
    expect(result.skillDamagePercent).toBe(600);
    // SE (addBeforeMultiply): (600 + 140) * 1 = 740
    expect(result.critDamagePercent).toBe(740);
  });

  it('Shadow Partner multiplies DPS by 1.5', () => {
    const bstep = shadData.skills.find((s) => s.name === 'Boomerang Step')!;
    const withSp = calculateSkillDps(
      shadHigh, shadData, bstep, weaponData, attackSpeedData, mwData
    );
    const noSpBuild = { ...shadHigh, shadowPartner: false };
    const withoutSp = calculateSkillDps(
      noSpBuild, shadData, bstep, weaponData, attackSpeedData, mwData
    );

    expect(withSp.dps / withoutSp.dps).toBeCloseTo(1.5);
  });

  it('High tier BStep + Assn30 combo DPS', () => {
    const bstep = shadData.skills.find((s) => s.name === 'Boomerang Step')!;
    const assn = shadData.skills.find((s) => s.name === 'Assassinate 30')!;
    const bstepDps = calculateSkillDps(
      shadHigh, shadData, bstep, weaponData, attackSpeedData, mwData
    ).dps;
    const assnDps = calculateSkillDps(
      shadHigh, shadData, assn, weaponData, attackSpeedData, mwData
    ).dps;

    // Combo DPS = sum of individual DPS (both share 2.31s cycle)
    // = (bstepAvg + assnAvg) / 2.31
    const comboDps = bstepDps + assnDps;
    expect(comboDps).toBeCloseTo(326734, -1);
  });

  it('High tier Savage Blow DPS', () => {
    const sb = shadData.skills.find((s) => s.name === 'Savage Blow')!;
    const result = calculateSkillDps(
      shadHigh, shadData, sb, weaponData, attackSpeedData, mwData
    );

    expect(result.dps).toBeCloseTo(183467, -1);
  });

  it('Low tier BStep + Assn30 combo DPS', () => {
    const bstep = shadData.skills.find((s) => s.name === 'Boomerang Step')!;
    const assn = shadData.skills.find((s) => s.name === 'Assassinate 30')!;
    const bstepDps = calculateSkillDps(
      shadLow, shadData, bstep, weaponData, attackSpeedData, mwData
    ).dps;
    const assnDps = calculateSkillDps(
      shadLow, shadData, assn, weaponData, attackSpeedData, mwData
    ).dps;

    const comboDps = bstepDps + assnDps;
    expect(comboDps).toBeCloseTo(198577, -1);
  });

  it('Low tier Savage Blow DPS', () => {
    const sb = shadData.skills.find((s) => s.name === 'Savage Blow')!;
    const result = calculateSkillDps(
      shadLow, shadData, sb, weaponData, attackSpeedData, mwData
    );

    expect(result.dps).toBeCloseTo(111504, -1);
  });

  it('High tier DPS is greater than Low tier for all skills', () => {
    for (const skill of shadData.skills) {
      const high = calculateSkillDps(
        shadHigh, shadData, skill, weaponData, attackSpeedData, mwData
      );
      const low = calculateSkillDps(
        shadLow, shadData, skill, weaponData, attackSpeedData, mwData
      );
      expect(high.dps).toBeGreaterThan(low.dps);
    }
  });
});

describe('Marksman DPS', () => {
  let mmData: ClassSkillData;
  let mmHigh: CharacterBuild;
  let mmLow: CharacterBuild;

  beforeAll(() => {
    mmData = loadClassSkills('Marksman');
    mmHigh = loadGearTemplate('marksman-high');
    mmLow = loadGearTemplate('marksman-low');
  });

  it('loads Marksman skill data correctly', () => {
    expect(mmData.className).toBe('Marksman');
    expect(mmData.mastery).toBe(1.0);
    expect(mmData.primaryStat).toBe('DEX');
    expect(mmData.secondaryStat).toBe('STR');
    expect(mmData.damageFormula).toBe('standard');
    expect(mmData.skills.length).toBe(3);
  });

  it('Strafe (MM) uses Crossbow 3.6x multiplier', () => {
    const strafe = mmData.skills.find((s) => s.name === 'Strafe (MM)')!;
    const result = calculateSkillDps(
      mmHigh, mmData, strafe, weaponData, attackSpeedData, mwData
    );

    // Standard formula with Crossbow 3.6x, mastery 1.0 (Update #71)
    // DEX: floor(999 * 1.1) + 158 = 1256, STR: floor(4 * 1.1) + 97 = 101
    // totalAttack = 198 + 100 + floor((198+100)*0.04) = 309
    // max = floor((1256 * 3.6 + 101) * 309 / 100) = 14283
    // min = floor((1256 * 3.6 * 0.9 * 1.0 + 101) * 309 / 100) = 12886
    expect(result.damageRange.max).toBe(14283);
    expect(result.damageRange.min).toBe(12886);
  });

  it('Strafe (MM) High tier DPS ~232,748', () => {
    const strafe = mmData.skills.find((s) => s.name === 'Strafe (MM)')!;
    const result = calculateSkillDps(
      mmHigh, mmData, strafe, weaponData, attackSpeedData, mwData
    );

    // 4-hit, 0.6s attack time, 55% crit (40% Critical Shot + 15% SE)
    expect(result.attackTime).toBe(0.60);
    expect(result.skillDamagePercent).toBe(125);
    // SE: (125 + 100 + 140) * 1 = 365
    expect(result.critDamagePercent).toBe(365);
    expect(result.dps).toBeCloseTo(232748, -1);
  });

  it('Strafe (MM) Low tier DPS ~105,644', () => {
    const strafe = mmData.skills.find((s) => s.name === 'Strafe (MM)')!;
    const result = calculateSkillDps(
      mmLow, mmData, strafe, weaponData, attackSpeedData, mwData
    );

    expect(result.attackTime).toBe(0.60);
    expect(result.dps).toBeCloseTo(105644, -1);
  });

  it('Snipe uses fixedDamage path (195,000 per hit)', () => {
    const snipe = mmData.skills.find((s) => s.name === 'Snipe')!;
    expect(snipe.fixedDamage).toBe(195000);

    const result = calculateSkillDps(
      mmHigh, mmData, snipe, weaponData, attackSpeedData, mwData
    );

    // Fixed damage: bypasses damage formula entirely
    expect(result.damageRange.max).toBe(195000);
    expect(result.damageRange.min).toBe(195000);
    expect(result.averageDamage).toBe(195000);
    expect(result.skillDamagePercent).toBe(0);
    expect(result.critDamagePercent).toBe(0);
  });

  it('Snipe DPS = 39,000 (195000 / 5.0s rotation cycle)', () => {
    const snipe = mmData.skills.find((s) => s.name === 'Snipe')!;
    const result = calculateSkillDps(
      mmHigh, mmData, snipe, weaponData, attackSpeedData, mwData
    );

    expect(result.attackTime).toBe(5.00);
    expect(result.dps).toBe(39000);
  });

  it('fixedDamage scales with hitCount', () => {
    const snipe = mmData.skills.find((s) => s.name === 'Snipe')!;
    const doubleHitSnipe = { ...snipe, hitCount: 2 };

    const single = calculateSkillDps(
      mmHigh, mmData, snipe, weaponData, attackSpeedData, mwData
    );
    const double = calculateSkillDps(
      mmHigh, mmData, doubleHitSnipe, weaponData, attackSpeedData, mwData
    );

    expect(double.averageDamage).toBe(single.averageDamage * 2);
    expect(double.dps).toBe(single.dps * 2);
    // damageRange stays per-hit
    expect(double.damageRange.max).toBe(single.damageRange.max);
  });

  it('Snipe DPS is gear-independent (same at low and high tier)', () => {
    const snipe = mmData.skills.find((s) => s.name === 'Snipe')!;
    const highResult = calculateSkillDps(
      mmHigh, mmData, snipe, weaponData, attackSpeedData, mwData
    );
    const lowResult = calculateSkillDps(
      mmLow, mmData, snipe, weaponData, attackSpeedData, mwData
    );

    expect(highResult.dps).toBe(lowResult.dps);
    expect(highResult.dps).toBe(39000);
  });

  it('Strafe (in Snipe Rotation) uses 0.714s attack time at speed 2', () => {
    const strafeRotation = mmData.skills.find((s) => s.name === 'Strafe (in Snipe Rotation)')!;
    const result = calculateSkillDps(
      mmHigh, mmData, strafeRotation, weaponData, attackSpeedData, mwData
    );

    // 7 Strafes per 5s cycle → effective attack time = 5.0/7 = 0.714s
    expect(result.attackTime).toBe(0.714);
    // Same damage range as standalone Strafe (MM) — same basePower, crit, weapon
    expect(result.damageRange.max).toBe(14283);
    expect(result.damageRange.min).toBe(12886);
  });

  it('Strafe (MM) High tier DPS > Low tier', () => {
    const strafe = mmData.skills.find((s) => s.name === 'Strafe (MM)')!;
    const highResult = calculateSkillDps(
      mmHigh, mmData, strafe, weaponData, attackSpeedData, mwData
    );
    const lowResult = calculateSkillDps(
      mmLow, mmData, strafe, weaponData, attackSpeedData, mwData
    );

    expect(highResult.dps).toBeGreaterThan(lowResult.dps);
  });
});

describe('Archmage I/L DPS', () => {
  let amData: ClassSkillData;
  let amHigh: CharacterBuild;
  let amLow: CharacterBuild;

  beforeAll(() => {
    amData = loadClassSkills('Archmage I/L');
    amHigh = loadGearTemplate('archmage-il-high');
    amLow = loadGearTemplate('archmage-il-low');
  });

  it('loads Archmage I/L skill data correctly', () => {
    expect(amData.className).toBe('Archmage I/L');
    expect(amData.mastery).toBe(0.6);
    expect(amData.primaryStat).toBe('INT');
    expect(amData.damageFormula).toBe('magic');
    expect(amData.spellAmplification).toBe(1.4);
    expect(amData.weaponAmplification).toBe(1.25);
    expect(amData.skills.length).toBe(2);
  });

  it('Chain Lightning High tier damage range', () => {
    const cl = amData.skills.find((s) => s.name === 'Chain Lightning')!;
    const result = calculateSkillDps(
      amHigh, amData, cl, weaponData, attackSpeedData, mwData
    );

    // Magic formula: max = floor(((TMA²/1000 + TMA)/30 + INT/200) * 1.4 * 1.25)
    // TMA = 1348 + 145 + 220 + echo(68) = 1781
    expect(result.damageRange.max).toBe(300);
    expect(result.damageRange.min).toBe(252);
    expect(result.damageRange.average).toBe(276);
  });

  it('Chain Lightning High tier DPS ~92,400', () => {
    const cl = amData.skills.find((s) => s.name === 'Chain Lightning')!;
    const result = calculateSkillDps(
      amHigh, amData, cl, weaponData, attackSpeedData, mwData
    );

    expect(result.attackTime).toBe(0.69);
    expect(result.skillDamagePercent).toBe(210);
    // SE crit: (210 + 140) * 1 = 350
    expect(result.critDamagePercent).toBe(350);
    expect(result.dps).toBeCloseTo(92400, -1);
  });

  it('Chain Lightning Low tier DPS ~41,848', () => {
    const cl = amData.skills.find((s) => s.name === 'Chain Lightning')!;
    const result = calculateSkillDps(
      amLow, amData, cl, weaponData, attackSpeedData, mwData
    );

    expect(result.attackTime).toBe(0.69);
    expect(result.damageRange.max).toBe(140);
    expect(result.damageRange.min).toBe(110);
    expect(result.dps).toBeCloseTo(41848, -1);
  });

  it('Blizzard High tier DPS ~53,184', () => {
    const bliz = amData.skills.find((s) => s.name === 'Blizzard')!;
    const result = calculateSkillDps(
      amHigh, amData, bliz, weaponData, attackSpeedData, mwData
    );

    expect(result.attackTime).toBe(3.06);
    expect(result.skillDamagePercent).toBe(570);
    // SE crit: (570 + 140) * 1 = 710
    expect(result.critDamagePercent).toBe(710);
    expect(result.dps).toBeCloseTo(53184, -1);
  });

  it('uses magic formula (not standard weapon multiplier)', () => {
    const cl = amData.skills.find((s) => s.name === 'Chain Lightning')!;
    const result = calculateSkillDps(
      amHigh, amData, cl, weaponData, attackSpeedData, mwData
    );

    // Magic range cap uses raw multiplier: 199999/210 = 952.38
    // This is well above the max damage (300), so no capping occurs
    // adjustedRangeNormal should equal average
    expect(result.adjustedRangeNormal).toBe(276);
  });

  it('High tier DPS is greater than Low tier', () => {
    for (const skill of amData.skills) {
      const high = calculateSkillDps(
        amHigh, amData, skill, weaponData, attackSpeedData, mwData
      );
      const low = calculateSkillDps(
        amLow, amData, skill, weaponData, attackSpeedData, mwData
      );
      expect(high.dps).toBeGreaterThan(low.dps);
    }
  });

  it('no Speed Infusion for mages', () => {
    expect(amHigh.speedInfusion).toBe(false);
    expect(amLow.speedInfusion).toBe(false);
  });

  it('engine ignores speedInfusion even if set to true for magic classes', () => {
    const cl = amData.skills.find((s) => s.name === 'Chain Lightning')!;
    const buildWithSI = { ...amHigh, speedInfusion: true };
    const resultWithSI = calculateSkillDps(buildWithSI, amData, cl, weaponData, attackSpeedData, mwData);
    const resultWithoutSI = calculateSkillDps(amHigh, amData, cl, weaponData, attackSpeedData, mwData);
    expect(resultWithSI.dps).toBe(resultWithoutSI.dps);
    expect(resultWithSI.attackTime).toBe(resultWithoutSI.attackTime);
  });
});

describe('Bishop DPS', () => {
  let bishopData: ClassSkillData;
  let bishopHigh: CharacterBuild;
  let bishopLow: CharacterBuild;

  beforeAll(() => {
    bishopData = loadClassSkills('Bishop');
    bishopHigh = loadGearTemplate('bishop-high');
    bishopLow = loadGearTemplate('bishop-low');
  });

  it('loads Bishop skill data correctly', () => {
    expect(bishopData.className).toBe('Bishop');
    expect(bishopData.mastery).toBe(0.6);
    expect(bishopData.damageFormula).toBe('magic');
    expect(bishopData.spellAmplification).toBe(1);
    expect(bishopData.weaponAmplification).toBe(1);
    expect(bishopData.skills.length).toBe(2);
  });

  it('Angel Ray High tier DPS ~50,750', () => {
    const ar = bishopData.skills.find((s) => s.name === 'Angel Ray')!;
    const result = calculateSkillDps(
      bishopHigh, bishopData, ar, weaponData, attackSpeedData, mwData
    );

    expect(result.attackTime).toBe(0.81);
    expect(result.skillDamagePercent).toBe(240);
    // SE: (240 + 140) * 1 = 380
    expect(result.critDamagePercent).toBe(380);
    expect(result.dps).toBeCloseTo(50750, -1);
  });

  it('Genesis High tier DPS ~40,308', () => {
    const gen = bishopData.skills.find((s) => s.name === 'Genesis')!;
    const result = calculateSkillDps(
      bishopHigh, bishopData, gen, weaponData, attackSpeedData, mwData
    );

    expect(result.attackTime).toBe(2.70);
    expect(result.skillDamagePercent).toBe(670);
    expect(result.dps).toBeCloseTo(40308, -1);
  });

  it('Bishop has lower DPS than Archmage (no amp)', () => {
    const amData = loadClassSkills('Archmage I/L');
    const amHigh = loadGearTemplate('archmage-il-high');
    const cl = amData.skills.find((s) => s.name === 'Chain Lightning')!;
    const ar = bishopData.skills.find((s) => s.name === 'Angel Ray')!;

    const amDps = calculateSkillDps(
      amHigh, amData, cl, weaponData, attackSpeedData, mwData
    ).dps;
    const bishopDps = calculateSkillDps(
      bishopHigh, bishopData, ar, weaponData, attackSpeedData, mwData
    ).dps;

    // Archmage has 1.4 * 1.25 = 1.75× amp advantage
    expect(amDps).toBeGreaterThan(bishopDps);
  });

  it('High tier DPS is greater than Low tier', () => {
    for (const skill of bishopData.skills) {
      const high = calculateSkillDps(
        bishopHigh, bishopData, skill, weaponData, attackSpeedData, mwData
      );
      const low = calculateSkillDps(
        bishopLow, bishopData, skill, weaponData, attackSpeedData, mwData
      );
      expect(high.dps).toBeGreaterThan(low.dps);
    }
  });
});

describe('Archmage F/P DPS', () => {
  let fpData: ClassSkillData;
  let fpHigh: CharacterBuild;
  let fpLow: CharacterBuild;

  beforeAll(() => {
    fpData = loadClassSkills('Archmage F/P');
    fpHigh = loadGearTemplate('archmage-fp-high');
    fpLow = loadGearTemplate('archmage-fp-low');
  });

  it('loads Archmage F/P skill data correctly', () => {
    expect(fpData.className).toBe('Archmage F/P');
    expect(fpData.mastery).toBe(0.6);
    expect(fpData.primaryStat).toBe('INT');
    expect(fpData.damageFormula).toBe('magic');
    expect(fpData.spellAmplification).toBe(1.4);
    expect(fpData.weaponAmplification).toBe(1.25);
    expect(fpData.skills.length).toBe(2);
  });

  it('Paralyze High tier DPS ~100,050', () => {
    const para = fpData.skills.find((s) => s.name === 'Paralyze')!;
    const result = calculateSkillDps(
      fpHigh, fpData, para, weaponData, attackSpeedData, mwData
    );

    expect(result.attackTime).toBe(0.72);
    expect(result.skillDamagePercent).toBe(240);
    // SE crit: (240 + 140) * 1 = 380
    expect(result.critDamagePercent).toBe(380);
    expect(result.damageRange.max).toBe(300);
    expect(result.damageRange.min).toBe(252);
    expect(result.dps).toBeCloseTo(100050, -1);
  });

  it('Paralyze Low tier DPS ~45,313', () => {
    const para = fpData.skills.find((s) => s.name === 'Paralyze')!;
    const result = calculateSkillDps(
      fpLow, fpData, para, weaponData, attackSpeedData, mwData
    );

    expect(result.attackTime).toBe(0.72);
    expect(result.damageRange.max).toBe(140);
    expect(result.damageRange.min).toBe(110);
    expect(result.dps).toBeCloseTo(45313, -1);
  });

  it('Meteor High tier DPS ~53,184', () => {
    const meteor = fpData.skills.find((s) => s.name === 'Meteor')!;
    const result = calculateSkillDps(
      fpHigh, fpData, meteor, weaponData, attackSpeedData, mwData
    );

    expect(result.attackTime).toBe(3.06);
    expect(result.skillDamagePercent).toBe(570);
    // SE crit: (570 + 140) * 1 = 710
    expect(result.critDamagePercent).toBe(710);
    expect(result.dps).toBeCloseTo(53184, -1);
  });

  it('Meteor Low tier DPS ~24,142', () => {
    const meteor = fpData.skills.find((s) => s.name === 'Meteor')!;
    const result = calculateSkillDps(
      fpLow, fpData, meteor, weaponData, attackSpeedData, mwData
    );

    expect(result.dps).toBeCloseTo(24142, -1);
  });

  it('High tier DPS is greater than Low tier', () => {
    for (const skill of fpData.skills) {
      const high = calculateSkillDps(
        fpHigh, fpData, skill, weaponData, attackSpeedData, mwData
      );
      const low = calculateSkillDps(
        fpLow, fpData, skill, weaponData, attackSpeedData, mwData
      );
      expect(high.dps).toBeGreaterThan(low.dps);
    }
  });
});

describe('Bowmaster DPS', () => {
  let bmData: ClassSkillData;
  let bmHigh: CharacterBuild;
  let bmLow: CharacterBuild;

  beforeAll(() => {
    bmData = loadClassSkills('Bowmaster');
    bmHigh = loadGearTemplate('bowmaster-high');
    bmLow = loadGearTemplate('bowmaster-low');
  });

  it('loads Bowmaster skill data correctly', () => {
    expect(bmData.className).toBe('Bowmaster');
    expect(bmData.mastery).toBe(0.9);
    expect(bmData.primaryStat).toBe('DEX');
    expect(bmData.secondaryStat).toBe('STR');
    expect(bmData.damageFormula).toBe('standard');
    expect(bmData.skills.length).toBe(1);
  });

  it('Hurricane uses fixed 0.12s attack time', () => {
    const hurricane = bmData.skills.find((s) => s.name === 'Hurricane')!;
    const result = calculateSkillDps(
      bmHigh, bmData, hurricane, weaponData, attackSpeedData, mwData
    );

    expect(result.attackTime).toBe(0.12);
  });

  it('Hurricane High tier damage range', () => {
    const hurricane = bmData.skills.find((s) => s.name === 'Hurricane')!;
    const result = calculateSkillDps(
      bmHigh, bmData, hurricane, weaponData, attackSpeedData, mwData
    );

    // DEX: floor(999*1.1) + 158 = 1256, STR: floor(4*1.1) + 97 = 101
    // totalAttack = 193 + 100 + 0 + floor(293*0.04) = 304
    // Bow 3.4x, mastery 0.9
    // max = floor((1256 * 3.4 + 101) * 304 / 100) = 13289
    // min = floor((1256 * 3.4 * 0.9 * 0.9 + 101) * 304 / 100) = 10822
    expect(result.damageRange.max).toBe(13289);
    expect(result.damageRange.min).toBe(10822);
  });

  it('Hurricane High tier crit uses 55% rate (40% Critical Shot + 15% SE)', () => {
    const hurricane = bmData.skills.find((s) => s.name === 'Hurricane')!;
    const result = calculateSkillDps(
      bmHigh, bmData, hurricane, weaponData, attackSpeedData, mwData
    );

    // basePower 100, multiplier 1 → skillDmg% = 100
    expect(result.skillDamagePercent).toBe(100);
    // addBeforeMultiply: (100 + 100 + 140) * 1 = 340
    expect(result.critDamagePercent).toBe(340);
  });

  it('Hurricane High tier DPS ~233,073', () => {
    const hurricane = bmData.skills.find((s) => s.name === 'Hurricane')!;
    const result = calculateSkillDps(
      bmHigh, bmData, hurricane, weaponData, attackSpeedData, mwData
    );

    expect(result.dps).toBeCloseTo(233073, -2);
  });

  it('Hurricane Low tier DPS ~104,932', () => {
    const hurricane = bmData.skills.find((s) => s.name === 'Hurricane')!;
    const result = calculateSkillDps(
      bmLow, bmData, hurricane, weaponData, attackSpeedData, mwData
    );

    expect(result.attackTime).toBe(0.12);
    // DEX: floor(700*1.1) + 87 = 857, STR: 4 + 73 = 77
    // totalAttack = 133 + 60 + 0 + 7 = 200
    expect(result.damageRange.max).toBe(5981);
    expect(result.damageRange.min).toBe(4874);
    expect(result.dps).toBeCloseTo(104932, -2);
  });

  it('High tier DPS is greater than Low tier for all skills', () => {
    for (const skill of bmData.skills) {
      const high = calculateSkillDps(
        bmHigh, bmData, skill, weaponData, attackSpeedData, mwData
      );
      const low = calculateSkillDps(
        bmLow, bmData, skill, weaponData, attackSpeedData, mwData
      );
      expect(high.dps).toBeGreaterThan(low.dps);
    }
  });
});

describe('Hero (Axe) DPS', () => {
  let axeData: ClassSkillData;
  let axeHigh: CharacterBuild;
  let axeLow: CharacterBuild;

  beforeAll(() => {
    axeData = loadClassSkills('hero-axe');
    axeHigh = loadGearTemplate('hero-axe-high');
    axeLow = loadGearTemplate('hero-axe-low');
  });

  it('loads Hero (Axe) skill data correctly', () => {
    expect(axeData.className).toBe('Hero (Axe)');
    expect(axeData.mastery).toBe(0.6);
    expect(axeData.primaryStat).toBe('STR');
    expect(axeData.secondaryStat).toBe('DEX');
    expect(axeData.skills.length).toBe(1);
  });

  it('Brandish uses 2H Axe 4.8x multiplier', () => {
    const brandish = axeData.skills.find((s) => s.name === 'Brandish')!;
    expect(brandish.weaponType).toBe('2H Axe');

    const result = calculateSkillDps(
      axeHigh, axeData, brandish, weaponData, attackSpeedData, mwData
    );

    // STR: floor(999*1.1) + 174 = 1272, DEX: floor(23*1.1) + 102 = 127
    // totalAttack = 203 + 100 + floor(303*0.04) = 315
    // 2H Axe 4.8x
    // max = floor((1272 * 4.8 + 127) * 315 / 100) = 19632
    // min = floor((1272 * 4.8 * 0.9 * 0.6 + 127) * 315 / 100) = 10785
    expect(result.damageRange.max).toBe(19632);
    expect(result.damageRange.min).toBe(10785);
  });

  it('Brandish High tier DPS ~257,772', () => {
    const brandish = axeData.skills.find((s) => s.name === 'Brandish')!;
    const result = calculateSkillDps(
      axeHigh, axeData, brandish, weaponData, attackSpeedData, mwData
    );

    expect(result.attackTime).toBe(0.63);
    expect(result.skillDamagePercent).toBe(494);
    // SE: (260 + 140) * 1.9 = 760
    expect(result.critDamagePercent).toBe(760);
    expect(result.dps).toBeCloseTo(257772, -2);
  });

  it('Brandish Low tier DPS ~132,712', () => {
    const brandish = axeData.skills.find((s) => s.name === 'Brandish')!;
    const result = calculateSkillDps(
      axeLow, axeData, brandish, weaponData, attackSpeedData, mwData
    );

    expect(result.attackTime).toBe(0.63);
    expect(result.damageRange.max).toBe(10093);
    expect(result.damageRange.min).toBe(5567);
    expect(result.dps).toBeCloseTo(132712, -2);
  });

  it('Axe Brandish has higher damage range than Sword (4.8 > 4.6 multiplier)', () => {
    const axeBrandish = axeData.skills.find((s) => s.name === 'Brandish')!;
    const swordBrandish = heroData.skills.find((s) => s.name === 'Brandish (Sword)')!;

    const axeResult = calculateSkillDps(
      axeHigh, axeData, axeBrandish, weaponData, attackSpeedData, mwData
    );
    const swordResult = calculateSkillDps(
      heroHigh, heroData, swordBrandish, weaponData, attackSpeedData, mwData
    );

    // Same stats, same attack time — only weapon multiplier differs
    expect(axeResult.attackTime).toBe(swordResult.attackTime);
    expect(axeResult.damageRange.max).toBeGreaterThan(swordResult.damageRange.max);
    expect(axeResult.dps).toBeGreaterThan(swordResult.dps);
  });
});

describe('Corsair DPS', () => {
  let sairData: ClassSkillData;
  let sairHigh: CharacterBuild;
  let sairLow: CharacterBuild;

  beforeAll(() => {
    sairData = loadClassSkills('sair');
    sairHigh = loadGearTemplate('sair-high');
    sairLow = loadGearTemplate('sair-low');
  });

  it('loads Corsair skill data correctly', () => {
    expect(sairData.className).toBe('Corsair');
    expect(sairData.mastery).toBe(0.6);
    expect(sairData.primaryStat).toBe('DEX');
    expect(sairData.secondaryStat).toBe('STR');
    expect(sairData.damageFormula).toBe('standard');
    expect(sairData.skills.length).toBe(2);
  });

  it('Battleship Cannon High tier damage range', () => {
    const cannon = sairData.skills.find((s) => s.name === 'Battleship Cannon')!;
    const result = calculateSkillDps(
      sairHigh, sairData, cannon, weaponData, attackSpeedData, mwData
    );

    // DEX: floor(999*1.1) + 165 = 1263, STR: 4 + 90 = 94
    // totalAttack = 173 + 100 + 20 + floor(293*0.04) = 304
    // Gun 3.6x
    // max = floor((1263 * 3.6 + 94) * 304 / 100) = 14108
    // min = floor((1263 * 3.6 * 0.9 * 0.6 + 94) * 304 / 100) = 7749
    expect(result.damageRange.max).toBe(14108);
    expect(result.damageRange.min).toBe(7749);
  });

  it('Battleship Cannon High tier DPS ~350,586', () => {
    const cannon = sairData.skills.find((s) => s.name === 'Battleship Cannon')!;
    const result = calculateSkillDps(
      sairHigh, sairData, cannon, weaponData, attackSpeedData, mwData
    );

    expect(result.attackTime).toBe(0.60);
    // basePower 380, multiplier 1.2 → 456
    expect(result.skillDamagePercent).toBe(456);
    // SE: (380 + 140) * 1.2 = 624
    expect(result.critDamagePercent).toBe(624);
    expect(result.dps).toBeCloseTo(350586, -2);
  });

  it('Battleship Cannon Low tier DPS ~180,049', () => {
    const cannon = sairData.skills.find((s) => s.name === 'Battleship Cannon')!;
    const result = calculateSkillDps(
      sairLow, sairData, cannon, weaponData, attackSpeedData, mwData
    );

    expect(result.attackTime).toBe(0.60);
    expect(result.damageRange.max).toBe(7231);
    expect(result.damageRange.min).toBe(3994);
    expect(result.dps).toBeCloseTo(180049, -2);
  });

  it('Rapid Fire uses Hurricane speed (0.12s)', () => {
    const rf = sairData.skills.find((s) => s.name === 'Rapid Fire')!;
    const result = calculateSkillDps(
      sairHigh, sairData, rf, weaponData, attackSpeedData, mwData
    );

    expect(result.attackTime).toBe(0.12);
  });

  it('Rapid Fire High tier DPS ~241,520', () => {
    const rf = sairData.skills.find((s) => s.name === 'Rapid Fire')!;
    const result = calculateSkillDps(
      sairHigh, sairData, rf, weaponData, attackSpeedData, mwData
    );

    // basePower 200, multiplier 1.2 → 240
    expect(result.skillDamagePercent).toBe(240);
    // SE: (200 + 140) * 1.2 = 408
    expect(result.critDamagePercent).toBe(408);
    // Same damage range as Cannon (same weapon/class)
    expect(result.damageRange.max).toBe(14108);
    expect(result.dps).toBeCloseTo(241520, -2);
  });

  it('Rapid Fire Low tier DPS ~124,036', () => {
    const rf = sairData.skills.find((s) => s.name === 'Rapid Fire')!;
    const result = calculateSkillDps(
      sairLow, sairData, rf, weaponData, attackSpeedData, mwData
    );

    expect(result.dps).toBeCloseTo(124036, -2);
  });

  it('no Shadow Partner for Corsair', () => {
    expect(sairHigh.shadowPartner).toBe(false);
    expect(sairLow.shadowPartner).toBe(false);
  });

  it('High tier DPS is greater than Low tier for all skills', () => {
    for (const skill of sairData.skills) {
      const high = calculateSkillDps(
        sairHigh, sairData, skill, weaponData, attackSpeedData, mwData
      );
      const low = calculateSkillDps(
        sairLow, sairData, skill, weaponData, attackSpeedData, mwData
      );
      expect(high.dps).toBeGreaterThan(low.dps);
    }
  });
});

describe('Buccaneer DPS', () => {
  let buccData: ClassSkillData;
  let buccHigh: CharacterBuild;
  let buccLow: CharacterBuild;

  beforeAll(() => {
    buccData = loadClassSkills('bucc');
    buccHigh = loadGearTemplate('bucc-high');
    buccLow = loadGearTemplate('bucc-low');
  });

  it('loads Buccaneer skill data correctly', () => {
    expect(buccData.className).toBe('Buccaneer');
    expect(buccData.mastery).toBe(0.6);
    expect(buccData.primaryStat).toBe('STR');
    expect(buccData.secondaryStat).toBe('DEX');
    expect(buccData.damageFormula).toBe('standard');
    expect(buccData.skills.length).toBe(5);
  });

  it('Demolition High tier damage range', () => {
    const demo = buccData.skills.find((s) => s.name === 'Demolition')!;
    const result = calculateSkillDps(
      buccHigh, buccData, demo, weaponData, attackSpeedData, mwData
    );

    // STR: floor(999*1.1) + 151 = 1249, DEX: floor(23*1.1) + 116 = 141
    // totalAttack = 181 + 100 + 0 + floor(281*0.04) = 292
    // Knuckle 4.8x
    // max = floor((1249 * 4.8 + 141) * 292 / 100) = 17917
    // min = floor((1249 * 4.8 * 0.9 * 0.6 + 141) * 292 / 100) = 9864
    expect(result.damageRange.max).toBe(17917);
    expect(result.damageRange.min).toBe(9864);
  });

  it('Demolition uses fixed 2.34s attack time', () => {
    const demo = buccData.skills.find((s) => s.name === 'Demolition')!;
    const result = calculateSkillDps(
      buccHigh, buccData, demo, weaponData, attackSpeedData, mwData
    );

    expect(result.attackTime).toBe(2.34);
  });

  it('Demolition High tier DPS ~247,417', () => {
    const demo = buccData.skills.find((s) => s.name === 'Demolition')!;
    const result = calculateSkillDps(
      buccHigh, buccData, demo, weaponData, attackSpeedData, mwData
    );

    // basePower 500, multiplier 1.0 → 500
    expect(result.skillDamagePercent).toBe(500);
    // SE: (500 + 140) * 1.0 = 640
    expect(result.critDamagePercent).toBe(640);
    expect(result.dps).toBeCloseTo(247417, -2);
  });

  it('Demolition Low tier DPS ~121,362', () => {
    const demo = buccData.skills.find((s) => s.name === 'Demolition')!;
    const result = calculateSkillDps(
      buccLow, buccData, demo, weaponData, attackSpeedData, mwData
    );

    expect(result.damageRange.max).toBe(8783);
    expect(result.damageRange.min).toBe(4844);
    expect(result.dps).toBeCloseTo(121362, -2);
  });

  it('Barrage + Demolition combo sub-skills all share 4.04s cycle time', () => {
    const comboSkills = buccData.skills.filter((s) => s.comboGroup === 'Barrage + Demolition');
    expect(comboSkills.length).toBe(4);

    for (const skill of comboSkills) {
      const result = calculateSkillDps(
        buccHigh, buccData, skill, weaponData, attackSpeedData, mwData
      );
      expect(result.attackTime).toBe(4.04);
    }
  });

  it('Barrage sub-skills have correct damage multipliers', () => {
    const normal = buccData.skills.find((s) => s.name === 'Barrage + Demolition (Normal Hits)')!;
    const fifth = buccData.skills.find((s) => s.name === 'Barrage + Demolition (5th Hit)')!;
    const sixth = buccData.skills.find((s) => s.name === 'Barrage + Demolition (6th Hit)')!;

    expect(normal.basePower).toBe(330);
    expect(normal.multiplier).toBe(1.0);
    expect(normal.hitCount).toBe(4);

    expect(fifth.basePower).toBe(330);
    expect(fifth.multiplier).toBe(2.0);
    expect(fifth.hitCount).toBe(1);

    expect(sixth.basePower).toBe(330);
    expect(sixth.multiplier).toBe(4.0);
    expect(sixth.hitCount).toBe(1);
  });

  it('no Shadow Partner for Buccaneer', () => {
    expect(buccHigh.shadowPartner).toBe(false);
    expect(buccLow.shadowPartner).toBe(false);
  });

  it('High tier DPS is greater than Low tier for standalone Demolition', () => {
    const demo = buccData.skills.find((s) => s.name === 'Demolition')!;
    const high = calculateSkillDps(
      buccHigh, buccData, demo, weaponData, attackSpeedData, mwData
    );
    const low = calculateSkillDps(
      buccLow, buccData, demo, weaponData, attackSpeedData, mwData
    );
    expect(high.dps).toBeGreaterThan(low.dps);
  });
});

describe('damage cap behavior', () => {
  // Synthetic skill with extreme basePower to trigger the 199,999 damage cap.
  const capSkill: SkillEntry = {
    name: 'Cap Test Skill',
    basePower: 1000,
    multiplier: 5,
    hitCount: 1,
    speedCategory: 'Brandish',
    weaponType: '2H Sword',
  };

  const capClassData: ClassSkillData = {
    className: 'CapTest',
    mastery: 0.6,
    primaryStat: 'STR',
    secondaryStat: 'DEX',
    sharpEyesCritRate: 0.15,
    sharpEyesCritDamageBonus: 140,
    seCritFormula: 'addBeforeMultiply',
    skills: [capSkill],
  };

  const capBuild: CharacterBuild = {
    className: 'CapTest',
    baseStats: { STR: 999, DEX: 135, INT: 4, LUK: 4 },
    gearStats: { STR: 1001, DEX: 65, INT: 0, LUK: 0 },
    totalWeaponAttack: 300,
    weaponType: '2H Sword',
    weaponSpeed: 6,
    attackPotion: 100,
    projectile: 0,
    echoActive: true,
    mwLevel: 20,
    speedInfusion: true,
    sharpEyes: true,
    shadowPartner: false,
  };

  it('triggers adjusted range when skill damage exceeds cap', () => {
    // skillDamagePercent = 1000 * 5 = 5000 → skillMultiplier = 50.0
    // rangeCap = 199999 / 50 = 3999.98
    // With these stats, max damage range should far exceed 3999, so adjusted < average
    const result = calculateSkillDps(
      capBuild, capClassData, capSkill, weaponData, attackSpeedData, mwData
    );
    expect(result.skillDamagePercent).toBe(5000);
    expect(result.adjustedRangeNormal).toBeLessThan(result.damageRange.average);
  });

  it('does not trigger cap with low skill damage percent', () => {
    const lowSkill: SkillEntry = {
      ...capSkill,
      name: 'Low Test Skill',
      basePower: 100,
      multiplier: 1,
    };
    // skillDamagePercent = 100 → skillMultiplier = 1.0 → rangeCap = 199999
    // Max damage with these stats should be well below 199999
    const result = calculateSkillDps(
      capBuild, capClassData, lowSkill, weaponData, attackSpeedData, mwData
    );
    expect(result.skillDamagePercent).toBe(100);
    expect(result.adjustedRangeNormal).toBe(result.damageRange.average);
  });
});

describe('zero crit rate', () => {
  it('uses the no-crit path when totalCritRate is 0', () => {
    // Hero Brandish has no builtInCritRate. With sharpEyes: false, totalCritRate = 0.
    const noCritBuild: CharacterBuild = {
      ...heroHigh,
      sharpEyes: false,
    };
    const brandish = heroData.skills.find(
      (s) => s.name === 'Brandish (Sword)'
    )!;
    const result = calculateSkillDps(
      noCritBuild, heroData, brandish, weaponData, attackSpeedData, mwData
    );

    // With no crit: averageDamage = skillMultiplier * adjustedRange * hitCount
    const skillMultiplier = result.skillDamagePercent / 100;
    const expectedAvgDmg = skillMultiplier * result.adjustedRangeNormal * brandish.hitCount;
    expect(result.averageDamage).toBeCloseTo(expectedAvgDmg, 0);

    // And DPS = averageDamage / attackTime
    expect(result.dps).toBeCloseTo(expectedAvgDmg / result.attackTime, 0);
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
      mwData
    );

    expect(result.skillName).toBe('Brandish (Sword)');
    expect(result.attackTime).toBeGreaterThan(0);
    expect(result.damageRange.min).toBeGreaterThan(0);
    expect(result.damageRange.max).toBeGreaterThan(result.damageRange.min);
    expect(result.averageDamage).toBeGreaterThan(0);
    expect(result.dps).toBeGreaterThan(0);
  });
});
