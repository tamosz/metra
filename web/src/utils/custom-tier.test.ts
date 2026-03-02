import { describe, it, expect } from 'vitest';
import { applyCustomTierToTemplate, generateCustomTierTemplates } from './custom-tier.js';
import { discoveredData } from '../data/bundle.js';
import type { CustomTier } from '../types/custom-tier.js';
import { DEFAULT_ADJUSTMENTS } from '../types/custom-tier.js';

describe('applyCustomTierToTemplate', () => {
  const { classDataMap, gearTemplates } = discoveredData;

  it('applies primary stat delta to Hero (STR class)', () => {
    const heroMid = gearTemplates.get('hero-mid')!;
    const heroData = classDataMap.get('hero')!;

    const result = applyCustomTierToTemplate(heroMid, heroData, {
      ...DEFAULT_ADJUSTMENTS,
      primaryStatDelta: 50,
    });

    expect(result.baseStats.STR).toBe(heroMid.baseStats.STR + 50);
    expect(result.baseStats.DEX).toBe(heroMid.baseStats.DEX);
    expect(result.totalWeaponAttack).toBe(heroMid.totalWeaponAttack);
  });

  it('applies primary stat delta to NL (LUK class)', () => {
    const nlMid = gearTemplates.get('nl-mid')!;
    const nlData = classDataMap.get('nl')!;

    const result = applyCustomTierToTemplate(nlMid, nlData, {
      ...DEFAULT_ADJUSTMENTS,
      primaryStatDelta: 100,
    });

    expect(result.baseStats.LUK).toBe(nlMid.baseStats.LUK + 100);
    expect(result.baseStats.STR).toBe(nlMid.baseStats.STR);
  });

  it('applies WATK delta', () => {
    const heroMid = gearTemplates.get('hero-mid')!;
    const heroData = classDataMap.get('hero')!;

    const result = applyCustomTierToTemplate(heroMid, heroData, {
      ...DEFAULT_ADJUSTMENTS,
      watkDelta: 30,
    });

    expect(result.totalWeaponAttack).toBe(heroMid.totalWeaponAttack + 30);
  });

  it('overrides buff toggles when set', () => {
    const heroMid = gearTemplates.get('hero-mid')!;
    const heroData = classDataMap.get('hero')!;

    const result = applyCustomTierToTemplate(heroMid, heroData, {
      ...DEFAULT_ADJUSTMENTS,
      echoActive: false,
      sharpEyes: false,
    });

    expect(result.echoActive).toBe(false);
    expect(result.sharpEyes).toBe(false);
    expect(result.speedInfusion).toBe(heroMid.speedInfusion);
  });

  it('keeps base values when override is null', () => {
    const heroMid = gearTemplates.get('hero-mid')!;
    const heroData = classDataMap.get('hero')!;

    const result = applyCustomTierToTemplate(heroMid, heroData, DEFAULT_ADJUSTMENTS);

    expect(result.echoActive).toBe(heroMid.echoActive);
    expect(result.attackPotion).toBe(heroMid.attackPotion);
    expect(result.mwLevel).toBe(heroMid.mwLevel);
  });

  it('applies secondary stat delta to Shadower (array secondaryStat)', () => {
    const shadMid = gearTemplates.get('shadower-mid')!;
    const shadData = classDataMap.get('shadower')!;

    const result = applyCustomTierToTemplate(shadMid, shadData, {
      ...DEFAULT_ADJUSTMENTS,
      secondaryStatDelta: 20,
    });

    // Shadower has secondaryStat: ["STR", "DEX"], both should get +20
    expect(result.baseStats.STR).toBe(shadMid.baseStats.STR + 20);
    expect(result.baseStats.DEX).toBe(shadMid.baseStats.DEX + 20);
    expect(result.baseStats.LUK).toBe(shadMid.baseStats.LUK);
  });
});

describe('generateCustomTierTemplates', () => {
  const { classNames, classDataMap, gearTemplates } = discoveredData;

  it('generates entries for all classes', () => {
    const customTier: CustomTier = {
      id: 'test-tier',
      name: 'Test Tier',
      baseTier: 'mid',
      adjustments: { ...DEFAULT_ADJUSTMENTS, watkDelta: 10 },
    };

    const result = generateCustomTierTemplates(customTier, classNames, classDataMap, gearTemplates);

    expect(result.size).toBe(classNames.length);
    for (const className of classNames) {
      expect(result.has(`${className}-test-tier`)).toBe(true);
    }
  });

  it('each generated template has the adjusted WATK', () => {
    const customTier: CustomTier = {
      id: 'watk-test',
      name: 'WATK Test',
      baseTier: 'mid',
      adjustments: { ...DEFAULT_ADJUSTMENTS, watkDelta: 25 },
    };

    const result = generateCustomTierTemplates(customTier, classNames, classDataMap, gearTemplates);

    for (const className of classNames) {
      const base = gearTemplates.get(`${className}-mid`)!;
      const custom = result.get(`${className}-watk-test`)!;
      expect(custom.totalWeaponAttack).toBe(base.totalWeaponAttack + 25);
    }
  });
});
