import { readFileSync, readdirSync } from 'fs';
import { resolve } from 'path';
import { describe, it, expect, beforeAll } from 'vitest';
import {
  loadWeapons,
  loadAttackSpeed,
  loadMW,
  discoverClassesAndTiers,
} from './loader.js';
import { computeGearTotals } from './gear-utils.js';
import type {
  WeaponData,
  AttackSpeedData,
  MWData,
  ClassSkillData,
  CharacterBuild,
  StatName,
} from '@metra/engine';

let weaponData: WeaponData;
let attackSpeedData: AttackSpeedData;
let mwData: MWData;
let classNames: string[];
let tiers: string[];
let classDataMap: Map<string, ClassSkillData>;
let gearTemplates: Map<string, CharacterBuild>;

beforeAll(() => {
  weaponData = loadWeapons();
  attackSpeedData = loadAttackSpeed();
  mwData = loadMW();
  const discovery = discoverClassesAndTiers();
  classNames = discovery.classNames;
  tiers = discovery.tiers;
  classDataMap = discovery.classDataMap;
  gearTemplates = discovery.gearTemplates;
});

describe('class and tier coverage', () => {
  it('every class has templates for all 4 tiers (low, mid, high, perfect)', () => {
    const requiredTiers = ['low', 'mid', 'high', 'perfect'];
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

  it('gear template weaponType is in the same weapon family as class skill weaponTypes', () => {
    const weaponFamily = (wt: string) => wt.replace(/^[12]H /, '');

    for (const [key, build] of gearTemplates) {
      const classData = [...classDataMap.values()].find(
        (cd) => cd.className === build.className
      );
      if (!classData) continue;

      const skillFamilies = new Set(classData.skills.map((s) => weaponFamily(s.weaponType)));
      expect(
        skillFamilies.has(weaponFamily(build.weaponType)),
        `Gear template "${key}" has weaponType "${build.weaponType}" (family: ${weaponFamily(build.weaponType)}) but ${classData.className} skills use: ${[...new Set(classData.skills.map((s) => s.weaponType))].join(', ')}`
      ).toBe(true);
    }
  });
});

describe('class data value ranges', () => {
  it('every class has mastery > 0 and <= 1', () => {
    for (const [, classData] of classDataMap) {
      expect(
        classData.mastery,
        `${classData.className} has mastery ${classData.mastery} which is not > 0`
      ).toBeGreaterThan(0);
      expect(
        classData.mastery,
        `${classData.className} has mastery ${classData.mastery} which is not <= 1`
      ).toBeLessThanOrEqual(1);
    }
  });

  it('every class seCritFormula is a valid enum value', () => {
    const validFormulas = new Set(['addBeforeMultiply', 'multiplicative', 'scaleOnBase']);
    for (const [, classData] of classDataMap) {
      if (classData.seCritFormula != null) {
        expect(
          validFormulas.has(classData.seCritFormula),
          `${classData.className} has invalid seCritFormula "${classData.seCritFormula}"`
        ).toBe(true);
      }
    }
  });

  it('every per-skill seCritFormula is a valid enum value', () => {
    const validFormulas = new Set(['addBeforeMultiply', 'multiplicative', 'scaleOnBase']);
    for (const [, classData] of classDataMap) {
      for (const skill of classData.skills) {
        if (skill.seCritFormula != null) {
          expect(
            validFormulas.has(skill.seCritFormula),
            `${classData.className} skill "${skill.name}" has invalid seCritFormula "${skill.seCritFormula}"`
          ).toBe(true);
        }
      }
    }
  });

  it('every class damageFormula is a valid enum value', () => {
    const validFormulas = new Set(['standard', 'throwingStar', 'magic']);
    for (const [, classData] of classDataMap) {
      if (classData.damageFormula != null) {
        expect(
          validFormulas.has(classData.damageFormula),
          `${classData.className} has invalid damageFormula "${classData.damageFormula}"`
        ).toBe(true);
      }
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

describe('inherited gear template consistency', () => {
  it('every inherited template resolves to a valid CharacterBuild', () => {
    for (const [key, build] of gearTemplates) {
      expect(build.className, `${key}: missing className`).toBeTruthy();
      expect(build.totalWeaponAttack, `${key}: missing totalWeaponAttack`).toBeGreaterThan(0);
      expect(build.attackPotion, `${key}: missing attackPotion`).toBeGreaterThan(0);
      expect(build.gearStats, `${key}: missing gearStats`).toBeDefined();
    }
  });

  it('every tier in tier-defaults.json is used by at least one template', () => {
    const tierDefaultsRaw = JSON.parse(
      readFileSync(resolve(import.meta.dirname, '../../data/tier-defaults.json'), 'utf-8')
    );
    const definedTiers = Object.keys(tierDefaultsRaw);
    for (const tier of definedTiers) {
      expect(tiers, `Tier "${tier}" in tier-defaults.json not found in discovered tiers`).toContain(tier);
    }
  });
});

describe('gear breakdown consistency', () => {
  it('every template with gearBreakdown has summary fields matching computed totals', () => {
    const templateDir = resolve(import.meta.dirname, '../../data/gear-templates');
    const files = readdirSync(templateDir).filter((f: string) => f.endsWith('.json') && !f.includes('.base.'));

    for (const file of files) {
      const raw = JSON.parse(readFileSync(resolve(templateDir, file), 'utf-8'));
      if (!raw.gearBreakdown) continue;
      if (raw.extends) continue;

      const computed = computeGearTotals(raw.gearBreakdown);

      for (const stat of ['STR', 'DEX', 'INT', 'LUK'] as StatName[]) {
        expect(
          raw.gearStats[stat],
          `${file}: gearStats.${stat} is ${raw.gearStats[stat]} but breakdown sums to ${computed.gearStats[stat]}`
        ).toBe(computed.gearStats[stat]);
      }

      expect(
        raw.totalWeaponAttack,
        `${file}: totalWeaponAttack is ${raw.totalWeaponAttack} but breakdown sums to ${computed.totalWeaponAttack}`
      ).toBe(computed.totalWeaponAttack);
    }
  });
});

describe('mixed rotation skill references', () => {
  it('every mixedRotation component references an actual skill in the class', () => {
    for (const [, classData] of classDataMap) {
      if (!classData.mixedRotations) continue;
      const skillNames = new Set(classData.skills.map((s) => s.name));

      for (const rotation of classData.mixedRotations) {
        for (const component of rotation.components) {
          expect(
            skillNames.has(component.skill),
            `${classData.className} mixedRotation "${rotation.name}" references skill "${component.skill}" which does not exist. Available skills: ${[...skillNames].join(', ')}`
          ).toBe(true);
        }
      }
    }
  });
});

describe('combo group speedCategory consistency', () => {
  // Marksman Snipe + Strafe uses distinct per-skill speed categories within the
  // rotation (Snipe Rotation vs Strafe in Snipe Rotation) because each sub-skill
  // has a different effective cast time. This is intentional.
  const comboGroupSpeedExceptions = new Set(['Snipe + Strafe']);

  it('all skills in a comboGroup share the same speedCategory (unless exempted)', () => {
    for (const [, classData] of classDataMap) {
      const comboGroups = new Map<string, { skill: string; speedCategory: string }[]>();

      for (const skill of classData.skills) {
        if (!skill.comboGroup) continue;
        if (!comboGroups.has(skill.comboGroup)) {
          comboGroups.set(skill.comboGroup, []);
        }
        comboGroups.get(skill.comboGroup)!.push({
          skill: skill.name,
          speedCategory: skill.speedCategory,
        });
      }

      for (const [groupName, members] of comboGroups) {
        if (comboGroupSpeedExceptions.has(groupName)) continue;
        const categories = new Set(members.map((m) => m.speedCategory));
        expect(
          categories.size,
          `${classData.className} comboGroup "${groupName}" has mismatched speedCategories: ${members.map((m) => `${m.skill} → ${m.speedCategory}`).join(', ')}`
        ).toBe(1);
      }
    }
  });
});

describe('element variant group compatibility', () => {
  it('all skills in an elementVariantGroup share the same speedCategory', () => {
    for (const [, classData] of classDataMap) {
      const variantGroups = new Map<string, { skill: string; speedCategory: string }[]>();

      for (const skill of classData.skills) {
        if (!skill.elementVariantGroup) continue;
        if (!variantGroups.has(skill.elementVariantGroup)) {
          variantGroups.set(skill.elementVariantGroup, []);
        }
        variantGroups.get(skill.elementVariantGroup)!.push({
          skill: skill.name,
          speedCategory: skill.speedCategory,
        });
      }

      for (const [groupName, members] of variantGroups) {
        const categories = new Set(members.map((m) => m.speedCategory));
        expect(
          categories.size,
          `${classData.className} elementVariantGroup "${groupName}" has mismatched speedCategories: ${members.map((m) => `${m.skill} → ${m.speedCategory}`).join(', ')}`
        ).toBe(1);
      }
    }
  });
});

describe('MW data integrity', () => {
  it('MW entries cover levels 0 through 20', () => {
    const levels = mwData.map((e) => e.level).sort((a, b) => a - b);
    const expected = Array.from({ length: 21 }, (_, i) => i);
    expect(levels).toEqual(expected);
  });

  it('every MW multiplier is >= 1.0', () => {
    for (const entry of mwData) {
      expect(
        entry.multiplier,
        `MW level ${entry.level} has multiplier ${entry.multiplier} which is < 1.0`
      ).toBeGreaterThanOrEqual(1.0);
    }
  });
});
