import { describe, it, expect } from 'vitest';
import {
  loadWeapons,
  loadAttackSpeed,
  loadMW,
  loadClassSkills,
  loadGearTemplate,
  discoverClassesAndTiers,
} from './loader.js';
import { compareTiers } from '@metra/engine';

describe('loadWeapons', () => {
  it('loads weapon types with correct multipliers', () => {
    const weapons = loadWeapons();
    expect(weapons.types).toHaveLength(13);

    const twoHandedSword = weapons.types.find((w) => w.name === '2H Sword');
    expect(twoHandedSword).toBeDefined();
    expect(twoHandedSword!.slashMultiplier).toBe(4.6);
    expect(twoHandedSword!.stabMultiplier).toBe(4.6);

    const oneHandedAxe = weapons.types.find((w) => w.name === '1H Axe');
    expect(oneHandedAxe).toBeDefined();
    expect(oneHandedAxe!.slashMultiplier).toBe(4.4);
    expect(oneHandedAxe!.stabMultiplier).toBe(3.2);
  });
});

describe('loadAttackSpeed', () => {
  it('loads attack speed table', () => {
    const attackSpeed = loadAttackSpeed();
    expect(attackSpeed.categories).toContain('Brandish');
    expect(attackSpeed.entries).toHaveLength(5);

    // Brandish at speed 2 = 0.63s
    const speed2 = attackSpeed.entries.find((e) => e.speed === 2);
    expect(speed2!.times['Brandish']).toBe(0.63);
  });
});

describe('loadMW', () => {
  it('loads MW table with correct multipliers', () => {
    const mw = loadMW();
    expect(mw).toHaveLength(21);
    expect(mw[0].multiplier).toBe(1.0);
    expect(mw[20].multiplier).toBe(1.1);
  });
});

describe('loadClassSkills', () => {
  it('loads Hero skill data', () => {
    const hero = loadClassSkills('Hero');
    expect(hero.className).toBe('Hero');
    expect(hero.mastery).toBe(0.6);
    expect(hero.primaryStat).toBe('STR');
    expect(hero.sharpEyesCritRate).toBe(0.15);

    const brandishSword = hero.skills.find(
      (s) => s.name === 'Brandish (Sword)'
    );
    expect(brandishSword).toBeDefined();
    expect(brandishSword!.basePower).toBe(260);
    expect(brandishSword!.multiplier).toBe(1.9);
    expect(brandishSword!.hitCount).toBe(2);
  });

  it('loads damageFormula for each class', () => {
    const hero = loadClassSkills('Hero');
    expect(hero.damageFormula).toBe('standard');

    const nl = loadClassSkills('Night Lord');
    expect(nl.damageFormula).toBe('throwingStar');
  });
});

describe('loadGearTemplate', () => {
  it('loads hero-high gear template', () => {
    const build = loadGearTemplate('hero-high');
    expect(build.className).toBe('Hero');
    expect(build.baseStats.STR).toBe(943);
    expect(build.totalWeaponAttack).toBe(209);
    expect(build.attackPotion).toBe(100);
    expect(build.mwLevel).toBe(20);
  });

  it('loads hero-low gear template', () => {
    const build = loadGearTemplate('hero-low');
    expect(build.className).toBe('Hero');
    expect(build.baseStats.STR).toBe(818);
    expect(build.totalWeaponAttack).toBe(166);
    expect(build.attackPotion).toBe(60);
  });
});

describe('compareTiers', () => {
  it('sorts known tiers in canonical order', () => {
    const tiers = ['high', 'low', 'mid'];
    expect(tiers.sort(compareTiers)).toEqual(['low', 'mid', 'high']);
  });

  it('sorts unknown tiers after known tiers', () => {
    const tiers = ['ultra', 'low', 'high', 'mid'];
    expect(tiers.sort(compareTiers)).toEqual(['low', 'mid', 'high', 'ultra']);
  });

  it('sorts multiple unknown tiers alphabetically', () => {
    const tiers = ['zen', 'high', 'alpha', 'low'];
    expect(tiers.sort(compareTiers)).toEqual(['low', 'high', 'alpha', 'zen']);
  });
});

describe('discoverClassesAndTiers', () => {
  it('discovers all classes with skill files and gear templates', () => {
    const { classNames, tiers, classDataMap, gearTemplates } = discoverClassesAndTiers();

    // Should find at least the 9 implemented classes (hero-axe split from hero)
    expect(classNames.length).toBeGreaterThanOrEqual(9);
    expect(classNames).toContain('hero');
    expect(classNames).toContain('hero-axe');
    expect(classNames).toContain('dark-knight');
    expect(classNames).toContain('paladin');
    expect(classNames).toContain('night-lord');
    expect(classNames).toContain('bowmaster');
    expect(classNames).toContain('sair');
    expect(classNames).toContain('bucc');

    // Should find low and high tiers
    expect(tiers).toContain('low');
    expect(tiers).toContain('high');

    // classDataMap should have entries for each class
    for (const name of classNames) {
      expect(classDataMap.has(name)).toBe(true);
    }

    // gearTemplates should have entries for each class-tier combo
    expect(gearTemplates.size).toBeGreaterThanOrEqual(classNames.length * tiers.length);
  });

  it('loads correct class data', () => {
    const { classDataMap } = discoverClassesAndTiers();
    const hero = classDataMap.get('hero')!;
    expect(hero.className).toBe('Hero');
    expect(hero.mastery).toBe(0.6);
  });
});
