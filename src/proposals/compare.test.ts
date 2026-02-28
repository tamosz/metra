import { describe, it, expect, beforeAll } from 'vitest';
import {
  loadWeapons,
  loadAttackSpeed,
  loadMapleWarrior,
  loadClassSkills,
  loadGearTemplate,
} from '../data/loader.js';
import type {
  WeaponData,
  AttackSpeedData,
  MapleWarriorData,
  ClassSkillData,
} from '../data/types.js';
import { compareProposal } from './compare.js';
import type { SimulationConfig, GearTemplateMap } from './simulate.js';
import type { Proposal, ScenarioConfig } from './types.js';

let weaponData: WeaponData;
let attackSpeedData: AttackSpeedData;
let mapleWarriorData: MapleWarriorData;
let classDataMap: Map<string, ClassSkillData>;
let gearTemplates: GearTemplateMap;
let config: SimulationConfig;

beforeAll(() => {
  weaponData = loadWeapons();
  attackSpeedData = loadAttackSpeed();
  mapleWarriorData = loadMapleWarrior();

  classDataMap = new Map([
    ['hero', loadClassSkills('Hero')],
    ['drk', loadClassSkills('DrK')],
    ['paladin', loadClassSkills('Paladin')],
    ['nl', loadClassSkills('NL')],
  ]);

  gearTemplates = new Map([
    ['hero-low', loadGearTemplate('hero-low')],
    ['hero-high', loadGearTemplate('hero-high')],
    ['drk-low', loadGearTemplate('drk-low')],
    ['drk-high', loadGearTemplate('drk-high')],
    ['paladin-low', loadGearTemplate('paladin-low')],
    ['paladin-high', loadGearTemplate('paladin-high')],
    ['nl-low', loadGearTemplate('nl-low')],
    ['nl-high', loadGearTemplate('nl-high')],
  ]);

  config = {
    classes: ['hero', 'drk', 'paladin', 'nl'],
    tiers: ['low', 'high'],
  };
});

describe('compareProposal', () => {
  it('Brandish +20 only changes Hero DPS', () => {
    // Hero charts scenario 3: "Brandish + 20%" means +20 flat basePower (260→280)
    const proposal: Proposal = {
      name: 'Brandish +20',
      author: 'test',
      changes: [
        {
          target: 'hero.brandish-sword',
          field: 'basePower',
          from: 260,
          to: 280,
        },
      ],
    };

    const result = compareProposal(
      proposal,
      config,
      classDataMap,
      gearTemplates,
      weaponData,
      attackSpeedData,
      mapleWarriorData
    );

    // Should have results for all class × tier × skill combos
    expect(result.before.length).toBeGreaterThan(0);
    expect(result.after.length).toBe(result.before.length);
    expect(result.deltas.length).toBe(result.before.length);

    // All results should have scenario = 'Buffed' (default)
    for (const r of result.before) {
      expect(r.scenario).toBe('Buffed');
    }
    for (const d of result.deltas) {
      expect(d.scenario).toBe('Buffed');
    }

    // Hero Brandish (Sword) should change
    const heroBrandishHigh = result.deltas.find(
      (d) =>
        d.className === 'Hero' &&
        d.skillName === 'Brandish (Sword)' &&
        d.tier === 'high'
    )!;
    expect(heroBrandishHigh.change).toBeGreaterThan(0);
    expect(heroBrandishHigh.changePercent).toBeGreaterThan(0);

    // Verify Hero Brandish +20% High DPS matches hero charts scenario 3
    // Hero charts E5: 274167.0444444445
    expect(heroBrandishHigh.after).toBeCloseTo(274167, -1);

    // DrK should be unchanged
    const drkCrusherHigh = result.deltas.find(
      (d) =>
        d.className === 'DrK' &&
        d.skillName === 'Spear Crusher' &&
        d.tier === 'high'
    )!;
    expect(drkCrusherHigh.change).toBe(0);
    expect(drkCrusherHigh.changePercent).toBe(0);

    // Paladin should be unchanged
    const paladinBlastHigh = result.deltas.find(
      (d) =>
        d.className === 'Paladin' &&
        d.skillName === 'Blast (Holy, Sword)' &&
        d.tier === 'high'
    )!;
    expect(paladinBlastHigh.change).toBe(0);

    // NL should be unchanged
    const nlTtHigh = result.deltas.find(
      (d) =>
        d.className === 'NL' &&
        d.skillName === 'Triple Throw 30' &&
        d.tier === 'high'
    )!;
    expect(nlTtHigh.change).toBe(0);
    expect(nlTtHigh.changePercent).toBe(0);
  });

  it('cross-checks Brandish +20 Low DPS against hero charts scenario 3', () => {
    const proposal: Proposal = {
      name: 'Brandish +20',
      author: 'test',
      changes: [
        {
          target: 'hero.brandish-sword',
          field: 'basePower',
          from: 260,
          to: 280,
        },
      ],
    };

    const result = compareProposal(
      proposal,
      config,
      classDataMap,
      gearTemplates,
      weaponData,
      attackSpeedData,
      mapleWarriorData
    );

    const heroBrandishLow = result.deltas.find(
      (d) =>
        d.className === 'Hero' &&
        d.skillName === 'Brandish (Sword)' &&
        d.tier === 'low'
    )!;

    // After pendant fix (STR22/DEX23 → STR10/DEX10): 142185.23
    expect(heroBrandishLow.after).toBeCloseTo(142185, -1);
  });

  it('computes multi-class changes independently', () => {
    const proposal: Proposal = {
      name: 'Multi-class',
      author: 'test',
      changes: [
        { target: 'hero.brandish-sword', field: 'basePower', from: 260, to: 300 },
        { target: 'drk.spear-crusher', field: 'basePower', from: 170, to: 150 },
      ],
    };

    const result = compareProposal(
      proposal,
      config,
      classDataMap,
      gearTemplates,
      weaponData,
      attackSpeedData,
      mapleWarriorData
    );

    // Hero goes up
    const heroDelta = result.deltas.find(
      (d) => d.className === 'Hero' && d.skillName === 'Brandish (Sword)' && d.tier === 'high'
    )!;
    expect(heroDelta.change).toBeGreaterThan(0);

    // DrK goes down
    const drkDelta = result.deltas.find(
      (d) => d.className === 'DrK' && d.skillName === 'Spear Crusher' && d.tier === 'high'
    )!;
    expect(drkDelta.change).toBeLessThan(0);

    // Paladin unaffected
    const pallyDelta = result.deltas.find(
      (d) => d.className === 'Paladin' && d.skillName === 'Blast (Holy, Sword)' && d.tier === 'high'
    )!;
    expect(pallyDelta.change).toBe(0);

    // NL unaffected
    const nlDelta = result.deltas.find(
      (d) => d.className === 'NL' && d.skillName === 'Triple Throw 30' && d.tier === 'high'
    )!;
    expect(nlDelta.change).toBe(0);
  });
});

describe('compareProposal with multiple scenarios', () => {
  it('produces deltas for each scenario independently', () => {
    const scenarios: ScenarioConfig[] = [
      { name: 'Buffed' },
      {
        name: 'Unbuffed',
        overrides: {
          sharpEyes: false,
          echoActive: false,
          speedInfusion: false,
          mapleWarriorLevel: 0,
          attackPotion: 0,
        },
      },
    ];

    const multiConfig: SimulationConfig = {
      classes: ['hero'],
      tiers: ['high'],
      scenarios,
    };

    const proposal: Proposal = {
      name: 'Brandish +20',
      author: 'test',
      changes: [
        { target: 'hero.brandish-sword', field: 'basePower', from: 260, to: 280 },
      ],
    };

    const result = compareProposal(
      proposal,
      multiConfig,
      classDataMap,
      gearTemplates,
      weaponData,
      attackSpeedData,
      mapleWarriorData
    );

    // Should have results for both scenarios × skills
    const heroSkillCount = classDataMap.get('hero')!.skills.length;
    expect(result.deltas.length).toBe(heroSkillCount * 2);

    // Find Brandish deltas for each scenario
    const buffedDelta = result.deltas.find(
      (d) => d.skillName === 'Brandish (Sword)' && d.scenario === 'Buffed'
    )!;
    const unbuffedDelta = result.deltas.find(
      (d) => d.skillName === 'Brandish (Sword)' && d.scenario === 'Unbuffed'
    )!;

    expect(buffedDelta).toBeDefined();
    expect(unbuffedDelta).toBeDefined();

    // Both should show positive change
    expect(buffedDelta.change).toBeGreaterThan(0);
    expect(unbuffedDelta.change).toBeGreaterThan(0);

    // Buffed DPS should be higher than unbuffed DPS (before and after)
    expect(buffedDelta.before).toBeGreaterThan(unbuffedDelta.before);
    expect(buffedDelta.after).toBeGreaterThan(unbuffedDelta.after);
  });

  it('unbuffed scenario removes SE, Echo, MW, SI, and attack potion effects', () => {
    const scenarios: ScenarioConfig[] = [
      { name: 'Buffed' },
      {
        name: 'Unbuffed',
        overrides: {
          sharpEyes: false,
          echoActive: false,
          speedInfusion: false,
          mapleWarriorLevel: 0,
          attackPotion: 0,
        },
      },
    ];

    const multiConfig: SimulationConfig = {
      classes: ['hero'],
      tiers: ['high'],
      scenarios,
    };

    // No-change proposal to isolate scenario effects
    const proposal: Proposal = {
      name: 'No change',
      author: 'test',
      changes: [],
    };

    const result = compareProposal(
      proposal,
      multiConfig,
      classDataMap,
      gearTemplates,
      weaponData,
      attackSpeedData,
      mapleWarriorData
    );

    const buffedBrandish = result.deltas.find(
      (d) => d.skillName === 'Brandish (Sword)' && d.scenario === 'Buffed'
    )!;
    const unbuffedBrandish = result.deltas.find(
      (d) => d.skillName === 'Brandish (Sword)' && d.scenario === 'Unbuffed'
    )!;

    // No changes applied, so before === after for both
    expect(buffedBrandish.change).toBe(0);
    expect(unbuffedBrandish.change).toBe(0);

    // Unbuffed DPS should be significantly lower (no SE, Echo, MW, SI, potion)
    expect(unbuffedBrandish.before).toBeLessThan(buffedBrandish.before);
    // Rough sanity check: unbuffed should be at least 20% lower
    expect(unbuffedBrandish.before).toBeLessThan(buffedBrandish.before * 0.8);
  });

  it('no-echo scenario only removes Echo effect', () => {
    const scenarios: ScenarioConfig[] = [
      { name: 'Buffed' },
      { name: 'No-Echo', overrides: { echoActive: false } },
    ];

    const multiConfig: SimulationConfig = {
      classes: ['hero'],
      tiers: ['high'],
      scenarios,
    };

    const proposal: Proposal = {
      name: 'No change',
      author: 'test',
      changes: [],
    };

    const result = compareProposal(
      proposal,
      multiConfig,
      classDataMap,
      gearTemplates,
      weaponData,
      attackSpeedData,
      mapleWarriorData
    );

    const buffedBrandish = result.deltas.find(
      (d) => d.skillName === 'Brandish (Sword)' && d.scenario === 'Buffed'
    )!;
    const noEchoBrandish = result.deltas.find(
      (d) => d.skillName === 'Brandish (Sword)' && d.scenario === 'No-Echo'
    )!;

    // No-Echo should be slightly lower (Echo is 4% WATK)
    expect(noEchoBrandish.before).toBeLessThan(buffedBrandish.before);
    // But not drastically lower — within ~10%
    expect(noEchoBrandish.before).toBeGreaterThan(buffedBrandish.before * 0.9);
  });
});
