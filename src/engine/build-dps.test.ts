import { describe, it, expect, beforeAll } from 'vitest';
import {
  loadWeapons,
  loadAttackSpeed,
  loadMW,
  loadClassSkills,
} from '../data/loader.js';
import { TEST_BUILDS } from './test-builds.js';
import {
  calculateBuildDps,
  calculateSkillDps,
  type GameData,
  type ClassSkillData,
  type CharacterBuild,
} from '@metra/engine';

let gameData: GameData;
let heroData: ClassSkillData;
let heroHigh: CharacterBuild;
let buccData: ClassSkillData;
let buccHigh: CharacterBuild;

beforeAll(() => {
  gameData = {
    weaponData: loadWeapons(),
    attackSpeedData: loadAttackSpeed(),
    mwData: loadMW(),
  };
  heroData = loadClassSkills('hero');
  heroHigh = TEST_BUILDS['hero-high'];
  buccData = loadClassSkills('bucc');
  buccHigh = TEST_BUILDS['bucc-high'];
});

describe('calculateBuildDps', () => {
  it('returns per-skill results for a single-skill class', () => {
    const result = calculateBuildDps(heroHigh, heroData, gameData);
    expect(result.skills.length).toBeGreaterThan(0);
    expect(result.aggregated.length).toBeGreaterThan(0);

    for (const row of result.skills) {
      expect(row.skillName).toBeTruthy();
      expect(row.dps).toBeGreaterThan(0);
      expect(row.result).toBeDefined();
    }
  });

  it('matches individual calculateSkillDps results', () => {
    const result = calculateBuildDps(heroHigh, heroData, gameData);
    for (const skill of heroData.skills) {
      const expected = calculateSkillDps(heroHigh, heroData, skill, gameData);
      const row = result.skills.find((r) => r.skillName === skill.name);
      expect(row).toBeDefined();
      expect(row!.dps).toBeCloseTo(expected.dps, 0);
    }
  });

  it('aggregates combo groups for bucc', () => {
    const result = calculateBuildDps(buccHigh, buccData, gameData);
    const comboSkills = result.skills.filter((r) => r.comboGroup);
    expect(comboSkills.length).toBeGreaterThan(0);

    // Check that aggregated has the combo group name
    const comboGroup = comboSkills[0].comboGroup!;
    const aggregated = result.aggregated.find((r) => r.skillName === comboGroup);
    expect(aggregated).toBeDefined();

    // Sum of individual combo skill DPS should equal aggregated
    const expectedDps = comboSkills
      .filter((r) => r.comboGroup === comboGroup)
      .reduce((sum, r) => sum + r.dps, 0);
    expect(aggregated!.dps).toBeCloseTo(expectedDps, 0);
  });

  it('non-combo skills pass through to aggregated unchanged', () => {
    const result = calculateBuildDps(heroHigh, heroData, gameData);
    const nonCombo = result.skills.filter((r) => !r.comboGroup);
    for (const row of nonCombo) {
      const agg = result.aggregated.find((r) => r.skillName === row.skillName);
      expect(agg).toBeDefined();
      expect(agg!.dps).toBe(row.dps);
    }
  });

  it('supports element modifier', () => {
    const normal = calculateBuildDps(heroHigh, heroData, gameData);
    const withElement = calculateBuildDps(heroHigh, heroData, gameData, 1.5);
    // Element modifier changes the damage cap calculation, so DPS may differ
    expect(withElement.aggregated.length).toBe(normal.aggregated.length);
    for (const row of withElement.aggregated) {
      expect(row.dps).toBeGreaterThan(0);
    }
  });
});
