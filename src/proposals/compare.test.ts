import { describe, it, expect, beforeAll } from 'vitest';
import {
  loadWeapons,
  loadAttackSpeed,
  loadMW,
  loadClassSkills,
  loadGearTemplate,
} from '../data/loader.js';
import type {
  WeaponData,
  AttackSpeedData,
  MWData,
  ClassSkillData,
} from '../data/types.js';
import { compareProposal } from './compare.js';
import type { SimulationConfig, GearTemplateMap } from './simulate.js';
import type { Proposal, ScenarioConfig } from './types.js';

let weaponData: WeaponData;
let attackSpeedData: AttackSpeedData;
let mwData: MWData;
let classDataMap: Map<string, ClassSkillData>;
let gearTemplates: GearTemplateMap;
let config: SimulationConfig;

beforeAll(() => {
  weaponData = loadWeapons();
  attackSpeedData = loadAttackSpeed();
  mwData = loadMW();

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
      mwData
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

    // After C/G/S standardization: Brandish +20 High DPS
    expect(heroBrandishHigh.after).toBeCloseTo(264917, -1);

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
      mwData
    );

    const heroBrandishLow = result.deltas.find(
      (d) =>
        d.className === 'Hero' &&
        d.skillName === 'Brandish (Sword)' &&
        d.tier === 'low'
    )!;

    // After weapon WATK reduction (178→168): Brandish +20 Low DPS
    expect(heroBrandishLow.after).toBeCloseTo(136421, -1);
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
      mwData
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
          mwLevel: 0,
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
      mwData
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
          mwLevel: 0,
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
      mwData
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
      mwData
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

  it('bossing scenario applies PDR to DPS', () => {
    const scenarios: ScenarioConfig[] = [
      { name: 'Buffed' },
      { name: 'Bossing (50% PDR)', pdr: 0.5 },
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
      mwData
    );

    const buffedDelta = result.deltas.find(
      (d) => d.skillName === 'Brandish (Sword)' && d.scenario === 'Buffed'
    )!;
    const bossingDelta = result.deltas.find(
      (d) => d.skillName === 'Brandish (Sword)' && d.scenario === 'Bossing (50% PDR)'
    )!;

    // Bossing DPS should be exactly 50% of buffed DPS
    expect(bossingDelta.before).toBeCloseTo(buffedDelta.before * 0.5, 0);
    expect(bossingDelta.after).toBeCloseTo(buffedDelta.after * 0.5, 0);

    // Change should also be 50% of buffed change
    expect(bossingDelta.change).toBeCloseTo(buffedDelta.change * 0.5, 0);

    // Percent change should be the same regardless of PDR
    expect(bossingDelta.changePercent).toBeCloseTo(buffedDelta.changePercent, 2);
  });

  it('computes rank before and after within (scenario, tier) groups', () => {
    const scenarios: ScenarioConfig[] = [{ name: 'Buffed' }];

    const multiConfig: SimulationConfig = {
      classes: ['hero', 'drk'],
      tiers: ['high'],
      scenarios,
    };

    // Buff Hero Brandish significantly so it overtakes DrK Crusher
    const proposal: Proposal = {
      name: 'Brandish +40',
      author: 'test',
      changes: [
        { target: 'hero.brandish-sword', field: 'basePower', from: 260, to: 300 },
      ],
    };

    const result = compareProposal(
      proposal,
      multiConfig,
      classDataMap,
      gearTemplates,
      weaponData,
      attackSpeedData,
      mwData
    );

    // All deltas should have rank fields
    for (const d of result.deltas) {
      expect(d.rankBefore).toBeDefined();
      expect(d.rankAfter).toBeDefined();
      expect(d.rankBefore).toBeGreaterThan(0);
      expect(d.rankAfter).toBeGreaterThan(0);
    }

    // Find Brandish (Sword) high tier delta
    const heroBrandish = result.deltas.find(
      (d) => d.className === 'Hero' && d.skillName === 'Brandish (Sword)' && d.tier === 'high'
    )!;
    expect(heroBrandish).toBeDefined();
    // Rank should have potentially changed
    expect(typeof heroBrandish.rankBefore).toBe('number');
    expect(typeof heroBrandish.rankAfter).toBe('number');
  });

  it('PDR of 0 has no effect, PDR of 1 reduces DPS to zero', () => {
    const scenarios: ScenarioConfig[] = [
      { name: 'No PDR', pdr: 0 },
      { name: 'Full PDR', pdr: 1 },
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
      mwData
    );

    const noPdrDelta = result.deltas.find(
      (d) => d.skillName === 'Brandish (Sword)' && d.scenario === 'No PDR'
    )!;
    const fullPdrDelta = result.deltas.find(
      (d) => d.skillName === 'Brandish (Sword)' && d.scenario === 'Full PDR'
    )!;

    // No PDR → same as buffed
    expect(noPdrDelta.before).toBeGreaterThan(0);

    // Full PDR → zero DPS
    expect(fullPdrDelta.before).toBe(0);
    expect(fullPdrDelta.after).toBe(0);
  });
});
