import { describe, it, expect } from 'vitest';
import {
  loadWeapons,
  loadAttackSpeed,
  loadMapleWarrior,
  loadClassSkills,
  loadGearTemplate,
} from './loader.js';

describe('loadWeapons', () => {
  it('loads weapon types with correct multipliers', () => {
    const weapons = loadWeapons();
    expect(weapons.types).toHaveLength(7);

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
    expect(mw).toHaveLength(31);
    expect(mw[0].multiplier).toBe(1.0);
    expect(mw[20].multiplier).toBe(1.1);
    expect(mw[30].multiplier).toBe(1.15);
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
});

describe('loadGearTemplate', () => {
  it('loads hero-high gear template', () => {
    const build = loadGearTemplate('hero-high');
    expect(build.className).toBe('Hero');
    expect(build.baseStats.STR).toBe(999);
    expect(build.totalWeaponAttack).toBe(214);
    expect(build.attackPotion).toBe(100);
    expect(build.mapleWarriorLevel).toBe(20);
  });

  it('loads hero-low gear template', () => {
    const build = loadGearTemplate('hero-low');
    expect(build.className).toBe('Hero');
    expect(build.baseStats.STR).toBe(700);
    expect(build.totalWeaponAttack).toBe(178);
    expect(build.attackPotion).toBe(60);
  });
});
