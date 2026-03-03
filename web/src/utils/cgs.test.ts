import { describe, it, expect } from 'vitest';
import { CGS_DEFAULTS, applyCgsOverride } from './cgs.js';
import type { CharacterBuild, ClassSkillData } from '@engine/data/types.js';

function makeBuild(className: string, watk: number): CharacterBuild {
  return {
    className,
    baseStats: { STR: 100, DEX: 100, INT: 4, LUK: 4 },
    gearStats: { STR: 50, DEX: 50, INT: 0, LUK: 0 },
    totalWeaponAttack: watk,
    weaponType: '2H Sword',
    weaponSpeed: 5,
    attackPotion: 100,
    projectile: 0,
    echoActive: true,
    mwLevel: 20,
    speedInfusion: true,
    sharpEyes: true,
  };
}

function makeClassData(name: string, formula?: string): ClassSkillData {
  return {
    className: name,
    mastery: 0.6,
    primaryStat: 'STR',
    secondaryStat: 'DEX',
    sharpEyesCritRate: 0.15,
    sharpEyesCritDamageBonus: 140,
    damageFormula: formula as ClassSkillData['damageFormula'],
    skills: [],
  };
}

describe('CGS_DEFAULTS', () => {
  it('has correct values for all base tiers', () => {
    expect(CGS_DEFAULTS.low).toEqual({ cape: 10, glove: 12, shoe: 10 });
    expect(CGS_DEFAULTS.mid).toEqual({ cape: 15, glove: 16, shoe: 13 });
    expect(CGS_DEFAULTS.high).toEqual({ cape: 20, glove: 18, shoe: 16 });
    expect(CGS_DEFAULTS.perfect).toEqual({ cape: 22, glove: 22, shoe: 18 });
  });
});

describe('applyCgsOverride', () => {
  it('adjusts totalWeaponAttack by CGS delta', () => {
    const templates = new Map([['hero-high', makeBuild('Hero', 198)]]);
    const classDataMap = new Map([['hero', makeClassData('Hero')]]);
    const result = applyCgsOverride(templates, classDataMap, ['hero'], 'high', {
      cape: 22, glove: 18, shoe: 16,
    });
    expect(result.get('hero-high')!.totalWeaponAttack).toBe(200);
  });

  it('does not modify mage templates', () => {
    const templates = new Map([['archmage-il-high', makeBuild('Archmage I/L', 145)]]);
    const classDataMap = new Map([['archmage-il', makeClassData('Archmage I/L', 'magic')]]);
    const result = applyCgsOverride(templates, classDataMap, ['archmage-il'], 'high', {
      cape: 25, glove: 25, shoe: 25,
    });
    expect(result.get('archmage-il-high')!.totalWeaponAttack).toBe(145);
  });

  it('returns templates unchanged when CGS matches defaults', () => {
    const templates = new Map([['hero-high', makeBuild('Hero', 198)]]);
    const classDataMap = new Map([['hero', makeClassData('Hero')]]);
    const result = applyCgsOverride(templates, classDataMap, ['hero'], 'high', {
      cape: 20, glove: 18, shoe: 16,
    });
    expect(result.get('hero-high')!.totalWeaponAttack).toBe(198);
  });

  it('handles negative delta (lower CGS)', () => {
    const templates = new Map([['hero-high', makeBuild('Hero', 198)]]);
    const classDataMap = new Map([['hero', makeClassData('Hero')]]);
    const result = applyCgsOverride(templates, classDataMap, ['hero'], 'high', {
      cape: 15, glove: 15, shoe: 15,
    });
    expect(result.get('hero-high')!.totalWeaponAttack).toBe(189);
  });

  it('only modifies templates for the specified tier', () => {
    const templates = new Map([
      ['hero-high', makeBuild('Hero', 198)],
      ['hero-low', makeBuild('Hero', 163)],
    ]);
    const classDataMap = new Map([['hero', makeClassData('Hero')]]);
    const result = applyCgsOverride(templates, classDataMap, ['hero'], 'high', {
      cape: 25, glove: 18, shoe: 16,
    });
    expect(result.get('hero-high')!.totalWeaponAttack).toBe(203);
    expect(result.get('hero-low')!.totalWeaponAttack).toBe(163);
  });

  it('returns original map for unknown tier', () => {
    const templates = new Map([['hero-custom', makeBuild('Hero', 200)]]);
    const classDataMap = new Map([['hero', makeClassData('Hero')]]);
    const result = applyCgsOverride(templates, classDataMap, ['hero'], 'custom', {
      cape: 20, glove: 20, shoe: 20,
    });
    expect(result).toBe(templates);
  });
});
