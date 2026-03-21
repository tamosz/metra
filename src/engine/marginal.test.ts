import { describe, it, expect } from 'vitest';
import { calculateMarginalGains, type GameData } from '@metra/engine';
import { loadWeapons, loadAttackSpeed, loadMW, loadClassSkills } from '../data/loader.js';
import { TEST_BUILDS } from './test-builds.js';

const gameData: GameData = {
  weaponData: loadWeapons(),
  attackSpeedData: loadAttackSpeed(),
  mwData: loadMW(),
};

describe('calculateMarginalGains', () => {
  it('returns gains for WATK, primary, and secondary stats', () => {
    const classData = loadClassSkills('hero');
    const build = TEST_BUILDS['hero-high'];
    const skill = classData.skills.find(s => s.name === 'Brandish (Sword)')!;

    const gains = calculateMarginalGains(build, classData, skill, gameData);

    // Should have 3 entries: WATK, STR (primary), DEX (secondary)
    expect(gains).toHaveLength(3);
    expect(gains.map(g => g.stat)).toEqual(expect.arrayContaining(['WATK', 'STR', 'DEX']));

    // All gains should be positive
    for (const g of gains) {
      expect(g.dpsGain).toBeGreaterThan(0);
      expect(g.percentGain).toBeGreaterThan(0);
      expect(g.currentValue).toBeGreaterThan(0);
    }

    // Should be sorted by dpsGain descending
    for (let i = 1; i < gains.length; i++) {
      expect(gains[i - 1].dpsGain).toBeGreaterThanOrEqual(gains[i].dpsGain);
    }
  });

  it('shows WATK for mages (maps to MATK internally)', () => {
    const classData = loadClassSkills('archmage-il');
    const build = TEST_BUILDS['archmage-il-high'];
    const skill = classData.skills.find(s => s.name === 'Chain Lightning')!;

    const gains = calculateMarginalGains(build, classData, skill, gameData);

    expect(gains.map(g => g.stat)).toEqual(expect.arrayContaining(['WATK', 'INT', 'LUK']));
  });

  it('lists each secondary stat separately for multi-secondary classes', () => {
    const classData = loadClassSkills('shadower');
    const build = TEST_BUILDS['shadower-high'];
    const skill = classData.skills.find(s => s.name === 'Savage Blow')!;

    const gains = calculateMarginalGains(build, classData, skill, gameData);

    // Shadower: WATK, LUK (primary), STR (secondary), DEX (secondary)
    expect(gains).toHaveLength(4);
    expect(gains.map(g => g.stat)).toEqual(expect.arrayContaining(['WATK', 'LUK', 'STR', 'DEX']));
  });

  it('returns zero gain for fixedDamage skills', () => {
    const classData = loadClassSkills('marksman');
    const build = TEST_BUILDS['marksman-high'];
    const snipe = classData.skills.find(s => s.name === 'Snipe')!;

    const gains = calculateMarginalGains(build, classData, snipe, gameData);

    // Snipe has fixedDamage — all stat gains should be 0
    for (const g of gains) {
      expect(g.dpsGain).toBe(0);
    }
  });
});
