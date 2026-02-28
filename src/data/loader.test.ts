import { describe, it, expect } from 'vitest';
import {
  loadWeapons,
  loadAttackSpeed,
  loadMapleWarrior,
  loadClassSkills,
  loadGearTemplate,
  discoverClassesAndTiers,
} from './loader.js';

describe('loadWeapons', () => {
  it('loads weapon types with correct multipliers', () => {
    const weapons = loadWeapons();
    expect(weapons.types).toHaveLength(12);

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

describe('loadMapleWarrior', () => {
  it('loads MW table with correct multipliers', () => {
    const mw = loadMapleWarrior();
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

    const nl = loadClassSkills('NL');
    expect(nl.damageFormula).toBe('throwingStar');
  });
});

describe('loadGearTemplate', () => {
  it('loads hero-high gear template', () => {
    const build = loadGearTemplate('hero-high');
    expect(build.className).toBe('Hero');
    expect(build.baseStats.STR).toBe(999);
    expect(build.totalWeaponAttack).toBe(203);
    expect(build.attackPotion).toBe(100);
    expect(build.mapleWarriorLevel).toBe(20);
  });

  it('loads hero-low gear template', () => {
    const build = loadGearTemplate('hero-low');
    expect(build.className).toBe('Hero');
    expect(build.baseStats.STR).toBe(700);
    expect(build.totalWeaponAttack).toBe(168);
    expect(build.attackPotion).toBe(60);
  });
});

describe('discoverClassesAndTiers', () => {
  it('discovers all classes with skill files and gear templates', () => {
    const { classNames, tiers, classDataMap, gearTemplates } = discoverClassesAndTiers();

    // Should find at least the 7 implemented classes
    expect(classNames.length).toBeGreaterThanOrEqual(7);
    expect(classNames).toContain('hero');
    expect(classNames).toContain('drk');
    expect(classNames).toContain('paladin');
    expect(classNames).toContain('nl');
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
