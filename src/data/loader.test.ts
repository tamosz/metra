import { describe, it, expect } from 'vitest';
import {
  loadWeapons,
  loadAttackSpeed,
  loadMW,
  loadClassSkills,
  loadGearTemplate,
  discoverClasses,
} from './loader.js';

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
  it('loads a mage perfect gear template', () => {
    const build = loadGearTemplate('archmage-il-perfect');
    expect(build.className).toBe('Archmage I/L');
    expect(build.totalWeaponAttack).toBeGreaterThan(0);
    expect(build.gearStats).toBeDefined();
  });
});

describe('discoverClasses', () => {
  it('discovers all classes with skill files and base files', () => {
    const { classNames, classDataMap, builds } = discoverClasses();

    // Should find at least the 14 implemented classes
    expect(classNames.length).toBeGreaterThanOrEqual(9);
    expect(classNames).toContain('hero');
    expect(classNames).toContain('hero-axe');
    expect(classNames).toContain('dark-knight');
    expect(classNames).toContain('paladin');
    expect(classNames).toContain('night-lord');
    expect(classNames).toContain('bowmaster');
    expect(classNames).toContain('sair');
    expect(classNames).toContain('bucc');

    // classDataMap should have entries for each class
    for (const name of classNames) {
      expect(classDataMap.has(name)).toBe(true);
    }

    // builds should have one entry per class
    for (const name of classNames) {
      expect(builds.has(name), `Missing build for ${name}`).toBe(true);
    }
  });

  it('loads correct class data', () => {
    const { classDataMap } = discoverClasses();
    const hero = classDataMap.get('hero')!;
    expect(hero.className).toBe('Hero');
    expect(hero.mastery).toBe(0.6);
  });

  it('mage classes use perfect template fallback', () => {
    const { builds } = discoverClasses();

    // Mage classes should have builds loaded from perfect templates
    const archmageFP = builds.get('archmage-fp');
    expect(archmageFP).toBeDefined();
    expect(archmageFP!.className).toBe('Archmage F/P');
    expect(archmageFP!.totalWeaponAttack).toBeGreaterThan(0);
  });
});
