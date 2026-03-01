import { describe, it, expect, beforeAll } from 'vitest';
import {
  loadWeapons,
  loadAttackSpeed,
  loadClassSkills,
  loadGearTemplate,
  discoverClassesAndTiers,
} from './loader.js';
import type {
  WeaponData,
  AttackSpeedData,
  ClassSkillData,
  CharacterBuild,
} from './types.js';

let weaponData: WeaponData;
let attackSpeedData: AttackSpeedData;
let classNames: string[];
let tiers: string[];
let classDataMap: Map<string, ClassSkillData>;
let gearTemplates: Map<string, CharacterBuild>;

beforeAll(() => {
  weaponData = loadWeapons();
  attackSpeedData = loadAttackSpeed();
  const discovery = discoverClassesAndTiers();
  classNames = discovery.classNames;
  tiers = discovery.tiers;
  classDataMap = discovery.classDataMap;
  gearTemplates = discovery.gearTemplates;
});

describe('class and tier coverage', () => {
  it('every class has templates for all 3 tiers (low, mid, high)', () => {
    const requiredTiers = ['low', 'mid', 'high'];
    for (const className of classNames) {
      for (const tier of requiredTiers) {
        const key = `${className}-${tier}`;
        expect(
          gearTemplates.has(key),
          `Missing gear template: ${key}`
        ).toBe(true);
      }
    }
  });
});

describe('gear template weapon types', () => {
  it('every standard-formula gear template weaponType exists in weapons.json', () => {
    const validWeaponTypes = new Set(weaponData.types.map((w) => w.name));
    // Magic and throwingStar formulas don't use weapon multipliers from weapons.json
    const exemptFormulas = new Set(['magic', 'throwingStar']);

    for (const [key, build] of gearTemplates) {
      const classData = [...classDataMap.values()].find(
        (cd) => cd.className === build.className
      );
      if (classData && exemptFormulas.has(classData.damageFormula ?? 'standard')) continue;

      expect(
        validWeaponTypes.has(build.weaponType),
        `Gear template "${key}" has weaponType "${build.weaponType}" not found in weapons.json. Valid types: ${[...validWeaponTypes].join(', ')}`
      ).toBe(true);
    }
  });
});

describe('skill speed categories', () => {
  it('every skill speedCategory exists in attack-speed.json', () => {
    const validCategories = new Set(attackSpeedData.categories);

    for (const [, classData] of classDataMap) {
      for (const skill of classData.skills) {
        expect(
          validCategories.has(skill.speedCategory),
          `${classData.className} skill "${skill.name}" has speedCategory "${skill.speedCategory}" not found in attack-speed.json. Valid categories: ${[...validCategories].join(', ')}`
        ).toBe(true);
      }
    }
  });

  it('every speed category has a time defined at each speed tier', () => {
    for (const entry of attackSpeedData.entries) {
      for (const category of attackSpeedData.categories) {
        expect(
          entry.times[category],
          `Speed ${entry.speed} is missing time for category "${category}"`
        ).toBeDefined();
      }
    }
  });
});

describe('skill weapon types', () => {
  it('every standard-formula skill weaponType exists in weapons.json', () => {
    const validWeaponTypes = new Set(weaponData.types.map((w) => w.name));
    const exemptFormulas = new Set(['magic', 'throwingStar']);

    for (const [, classData] of classDataMap) {
      if (exemptFormulas.has(classData.damageFormula ?? 'standard')) continue;

      for (const skill of classData.skills) {
        expect(
          validWeaponTypes.has(skill.weaponType),
          `${classData.className} skill "${skill.name}" has weaponType "${skill.weaponType}" not found in weapons.json`
        ).toBe(true);
      }
    }
  });
});

describe('gear template stat consistency', () => {
  it('every gear template has the primary stat in both baseStats and gearStats', () => {
    for (const [key, build] of gearTemplates) {
      const classData = [...classDataMap.values()].find(
        (cd) => cd.className === build.className
      );
      if (!classData) continue;

      const primary = classData.primaryStat;
      expect(
        build.baseStats[primary],
        `Gear template "${key}" is missing baseStats.${primary} (primary stat for ${classData.className})`
      ).toBeDefined();
      expect(
        build.baseStats[primary],
        `Gear template "${key}" has zero baseStats.${primary} — likely an error for primary stat`
      ).toBeGreaterThan(0);
    }
  });

  it('gear template weaponType matches class skill weaponTypes', () => {
    for (const [key, build] of gearTemplates) {
      const classData = [...classDataMap.values()].find(
        (cd) => cd.className === build.className
      );
      if (!classData) continue;

      const skillWeaponTypes = new Set(classData.skills.map((s) => s.weaponType));
      expect(
        skillWeaponTypes.has(build.weaponType),
        `Gear template "${key}" has weaponType "${build.weaponType}" but ${classData.className} skills use: ${[...skillWeaponTypes].join(', ')}`
      ).toBe(true);
    }
  });
});

describe('class skill data consistency', () => {
  it('every class has at least one skill', () => {
    for (const [, classData] of classDataMap) {
      expect(
        classData.skills.length,
        `${classData.className} has no skills defined`
      ).toBeGreaterThan(0);
    }
  });

  it('every skill has positive basePower and hitCount (unless fixedDamage)', () => {
    for (const [, classData] of classDataMap) {
      for (const skill of classData.skills) {
        if (skill.fixedDamage != null) continue;
        expect(
          skill.basePower,
          `${classData.className} "${skill.name}" has non-positive basePower`
        ).toBeGreaterThan(0);
        expect(
          skill.hitCount,
          `${classData.className} "${skill.name}" has non-positive hitCount`
        ).toBeGreaterThan(0);
        expect(
          skill.multiplier,
          `${classData.className} "${skill.name}" has non-positive multiplier`
        ).toBeGreaterThan(0);
      }
    }
  });

  it('comboGroup skills within a class all have valid speedCategories', () => {
    const validCategories = new Set(attackSpeedData.categories);

    for (const [, classData] of classDataMap) {
      for (const skill of classData.skills) {
        if (!skill.comboGroup) continue;
        expect(
          validCategories.has(skill.speedCategory),
          `${classData.className} comboGroup "${skill.comboGroup}" skill "${skill.name}" has invalid speedCategory "${skill.speedCategory}"`
        ).toBe(true);
      }
    }
  });
});
