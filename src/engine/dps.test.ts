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

beforeAll(() => {
  weaponData = loadWeapons();
  attackSpeedData = loadAttackSpeed();
  mapleWarriorData = loadMapleWarrior();
  heroData = loadClassSkills('Hero');
  heroHigh = loadGearTemplate('hero-high');
  heroLow = loadGearTemplate('hero-low');
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

    // Verify intermediate values
    expect(result.attackTime).toBe(0.63);
    expect(result.damageRange.max).toBe(10260);
    expect(result.damageRange.min).toBe(5677);
    expect(result.damageRange.average).toBe(7968.5);

    // Target from hero charts sheet F3: 135059.75079365078
    expect(result.dps).toBeCloseTo(135060, -1);
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

    // Exact value from spreadsheet: 135059.75079365078
    expect(Math.abs(result.dps - 135059.75079365078)).toBeLessThan(1);
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
