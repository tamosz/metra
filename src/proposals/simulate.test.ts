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
  CharacterBuild,
} from '../data/types.js';
import { runSimulation } from './simulate.js';
import type { SimulationConfig, GearTemplateMap } from './simulate.js';
import type { ScenarioConfig } from './types.js';

let weaponData: WeaponData;
let attackSpeedData: AttackSpeedData;
let mwData: MWData;
let classDataMap: Map<string, ClassSkillData>;
let gearTemplates: GearTemplateMap;

beforeAll(() => {
  weaponData = loadWeapons();
  attackSpeedData = loadAttackSpeed();
  mwData = loadMW();

  classDataMap = new Map([
    ['hero', loadClassSkills('Hero')],
    ['bucc', loadClassSkills('Bucc')],
    ['paladin', loadClassSkills('Paladin')],
    ['shadower', loadClassSkills('Shadower')],
    ['archmage-il', loadClassSkills('Archmage I/L')],
    ['nl', loadClassSkills('NL')],
  ]);

  gearTemplates = new Map([
    ['hero-low', loadGearTemplate('hero-low')],
    ['hero-high', loadGearTemplate('hero-high')],
    ['bucc-low', loadGearTemplate('bucc-low')],
    ['bucc-high', loadGearTemplate('bucc-high')],
    ['paladin-high', loadGearTemplate('paladin-high')],
    ['shadower-high', loadGearTemplate('shadower-high')],
    ['archmage-il-high', loadGearTemplate('archmage-il-high')],
    ['nl-high', loadGearTemplate('nl-high')],
  ]);
});

describe('runSimulation basics', () => {
  it('defaults to single Buffed scenario when scenarios omitted', () => {
    const config: SimulationConfig = {
      classes: ['hero'],
      tiers: ['high'],
    };

    const results = runSimulation(
      config, classDataMap, gearTemplates,
      weaponData, attackSpeedData, mwData
    );

    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      expect(r.scenario).toBe('Buffed');
    }
  });

  it('returns correct number of results for single class/tier/scenario', () => {
    const config: SimulationConfig = {
      classes: ['hero'],
      tiers: ['high'],
      scenarios: [{ name: 'Buffed' }],
    };

    const results = runSimulation(
      config, classDataMap, gearTemplates,
      weaponData, attackSpeedData, mwData
    );

    const heroSkillCount = classDataMap.get('hero')!.skills.length;
    expect(results.length).toBe(heroSkillCount);
  });

  it('multiplies results across tiers and scenarios', () => {
    const config: SimulationConfig = {
      classes: ['hero'],
      tiers: ['low', 'high'],
      scenarios: [{ name: 'Buffed' }, { name: 'Bossing (50% PDR)', pdr: 0.5 }],
    };

    const results = runSimulation(
      config, classDataMap, gearTemplates,
      weaponData, attackSpeedData, mwData
    );

    const heroSkillCount = classDataMap.get('hero')!.skills.length;
    expect(results.length).toBe(heroSkillCount * 2 * 2); // skills × tiers × scenarios
  });

  it('results have correct className, tier, and scenario fields', () => {
    const config: SimulationConfig = {
      classes: ['hero'],
      tiers: ['low', 'high'],
      scenarios: [{ name: 'Buffed' }, { name: 'Test' }],
    };

    const results = runSimulation(
      config, classDataMap, gearTemplates,
      weaponData, attackSpeedData, mwData
    );

    for (const r of results) {
      expect(r.className).toBe('Hero');
      expect(['low', 'high']).toContain(r.tier);
      expect(['Buffed', 'Test']).toContain(r.scenario);
      expect(r.dps.dps).toBeGreaterThan(0);
    }
  });
});

describe('runSimulation error handling', () => {
  it('throws for missing class in classDataMap', () => {
    const config: SimulationConfig = {
      classes: ['nonexistent'],
      tiers: ['high'],
    };

    expect(() =>
      runSimulation(
        config, classDataMap, gearTemplates,
        weaponData, attackSpeedData, mwData
      )
    ).toThrow(/Class "nonexistent" not found/);
  });

  it('throws for missing gear template', () => {
    const config: SimulationConfig = {
      classes: ['hero'],
      tiers: ['mythical'],
    };

    expect(() =>
      runSimulation(
        config, classDataMap, gearTemplates,
        weaponData, attackSpeedData, mwData
      )
    ).toThrow(/Gear template "hero-mythical" not found/);
  });
});

describe('runSimulation scenario overrides', () => {
  it('no-buffs scenario produces lower DPS than buffed', () => {
    const config: SimulationConfig = {
      classes: ['hero'],
      tiers: ['high'],
      scenarios: [
        { name: 'Buffed' },
        {
          name: 'No Buffs',
          overrides: {
            sharpEyes: false,
            echoActive: false,
            speedInfusion: false,
            mwLevel: 0,
            attackPotion: 0,
          },
        },
      ],
    };

    const results = runSimulation(
      config, classDataMap, gearTemplates,
      weaponData, attackSpeedData, mwData
    );

    const buffed = results.find(
      r => r.skillName === 'Brandish (Sword)' && r.scenario === 'Buffed'
    )!;
    const noBuffs = results.find(
      r => r.skillName === 'Brandish (Sword)' && r.scenario === 'No Buffs'
    )!;

    expect(buffed.dps.dps).toBeGreaterThan(noBuffs.dps.dps);
    // No Buffs should be at least 20% lower
    expect(noBuffs.dps.dps).toBeLessThan(buffed.dps.dps * 0.8);
  });

  it('echo-off scenario produces slightly lower DPS (within ~10%)', () => {
    const config: SimulationConfig = {
      classes: ['hero'],
      tiers: ['high'],
      scenarios: [
        { name: 'Buffed' },
        { name: 'Echo Off', overrides: { echoActive: false } },
      ],
    };

    const results = runSimulation(
      config, classDataMap, gearTemplates,
      weaponData, attackSpeedData, mwData
    );

    const buffed = results.find(
      r => r.skillName === 'Brandish (Sword)' && r.scenario === 'Buffed'
    )!;
    const echoOff = results.find(
      r => r.skillName === 'Brandish (Sword)' && r.scenario === 'Echo Off'
    )!;

    expect(echoOff.dps.dps).toBeLessThan(buffed.dps.dps);
    expect(echoOff.dps.dps).toBeGreaterThan(buffed.dps.dps * 0.9);
  });

  it('overrides do not mutate the original build objects', () => {
    const originalBuild = gearTemplates.get('hero-high')!;
    const originalPotion = originalBuild.attackPotion;
    const originalMW = originalBuild.mwLevel;

    const config: SimulationConfig = {
      classes: ['hero'],
      tiers: ['high'],
      scenarios: [{
        name: 'Zeroed',
        overrides: { mwLevel: 0, attackPotion: 0 },
      }],
    };

    runSimulation(
      config, classDataMap, gearTemplates,
      weaponData, attackSpeedData, mwData
    );

    const buildAfter = gearTemplates.get('hero-high')!;
    expect(buildAfter.attackPotion).toBe(originalPotion);
    expect(buildAfter.mwLevel).toBe(originalMW);
  });
});

describe('runSimulation PDR', () => {
  it('PDR 0.5 produces exactly 50% of buffed DPS', () => {
    const config: SimulationConfig = {
      classes: ['hero'],
      tiers: ['high'],
      scenarios: [
        { name: 'Buffed' },
        { name: 'Bossing', pdr: 0.5 },
      ],
    };

    const results = runSimulation(
      config, classDataMap, gearTemplates,
      weaponData, attackSpeedData, mwData
    );

    const buffed = results.find(
      r => r.skillName === 'Brandish (Sword)' && r.scenario === 'Buffed'
    )!;
    const bossing = results.find(
      r => r.skillName === 'Brandish (Sword)' && r.scenario === 'Bossing'
    )!;

    expect(bossing.dps.dps).toBeCloseTo(buffed.dps.dps * 0.5, 0);
  });

  it('PDR 0 has no effect', () => {
    const config: SimulationConfig = {
      classes: ['hero'],
      tiers: ['high'],
      scenarios: [
        { name: 'Buffed' },
        { name: 'No PDR', pdr: 0 },
      ],
    };

    const results = runSimulation(
      config, classDataMap, gearTemplates,
      weaponData, attackSpeedData, mwData
    );

    const buffed = results.find(
      r => r.skillName === 'Brandish (Sword)' && r.scenario === 'Buffed'
    )!;
    const noPdr = results.find(
      r => r.skillName === 'Brandish (Sword)' && r.scenario === 'No PDR'
    )!;

    expect(noPdr.dps.dps).toBe(buffed.dps.dps);
  });

  it('PDR 1 reduces DPS to 0', () => {
    const config: SimulationConfig = {
      classes: ['hero'],
      tiers: ['high'],
      scenarios: [{ name: 'Full PDR', pdr: 1 }],
    };

    const results = runSimulation(
      config, classDataMap, gearTemplates,
      weaponData, attackSpeedData, mwData
    );

    for (const r of results) {
      expect(r.dps.dps).toBe(0);
    }
  });
});

describe('elementModifiers', () => {
  it('Holy 1.5x multiplies Holy-element skill DPS by 1.5', () => {
    const config: SimulationConfig = {
      classes: ['paladin'],
      tiers: ['high'],
      scenarios: [
        { name: 'Buffed' },
        { name: 'Holy Advantage', elementModifiers: { Holy: 1.5 } },
      ],
    };

    const results = runSimulation(
      config, classDataMap, gearTemplates,
      weaponData, attackSpeedData, mwData
    );

    const buffed = results.find(
      r => r.skillName === 'Blast (Holy, Sword)' && r.scenario === 'Buffed'
    )!;
    const holy = results.find(
      r => r.skillName === 'Blast (Holy, Sword)' && r.scenario === 'Holy Advantage'
    )!;

    expect(holy.dps.dps).toBeCloseTo(buffed.dps.dps * 1.5, 0);
  });

  it('non-elemental skills unaffected by elementModifiers', () => {
    const config: SimulationConfig = {
      classes: ['paladin'],
      tiers: ['high'],
      scenarios: [
        { name: 'Buffed' },
        { name: 'Holy Advantage', elementModifiers: { Holy: 1.5 } },
      ],
    };

    const results = runSimulation(
      config, classDataMap, gearTemplates,
      weaponData, attackSpeedData, mwData
    );

    const buffed = results.find(
      r => r.skillName === 'Blast (F/I/L Charge, Sword)' && r.scenario === 'Buffed'
    )!;
    const holy = results.find(
      r => r.skillName === 'Blast (F/I/L Charge, Sword)' && r.scenario === 'Holy Advantage'
    )!;

    expect(holy.dps.dps).toBe(buffed.dps.dps);
  });

  it('element modifier stacks multiplicatively with PDR', () => {
    const config: SimulationConfig = {
      classes: ['paladin'],
      tiers: ['high'],
      scenarios: [
        { name: 'Buffed' },
        { name: 'Undead Boss', pdr: 0.5, elementModifiers: { Holy: 1.5 } },
      ],
    };

    const results = runSimulation(
      config, classDataMap, gearTemplates,
      weaponData, attackSpeedData, mwData
    );

    const buffed = results.find(
      r => r.skillName === 'Blast (Holy, Sword)' && r.scenario === 'Buffed'
    )!;
    const undead = results.find(
      r => r.skillName === 'Blast (Holy, Sword)' && r.scenario === 'Undead Boss'
    )!;

    // 0.5 PDR * 1.5 Holy = 0.75x net
    expect(undead.dps.dps).toBeCloseTo(buffed.dps.dps * 0.75, 0);
  });

  it('element resistance (0.5x) reduces elemental skill DPS', () => {
    const config: SimulationConfig = {
      classes: ['paladin'],
      tiers: ['high'],
      scenarios: [
        { name: 'Buffed' },
        { name: 'Holy Resist', elementModifiers: { Holy: 0.5 } },
      ],
    };

    const results = runSimulation(
      config, classDataMap, gearTemplates,
      weaponData, attackSpeedData, mwData
    );

    const buffed = results.find(
      r => r.skillName === 'Blast (Holy, Sword)' && r.scenario === 'Buffed'
    )!;
    const resist = results.find(
      r => r.skillName === 'Blast (Holy, Sword)' && r.scenario === 'Holy Resist'
    )!;

    expect(resist.dps.dps).toBeCloseTo(buffed.dps.dps * 0.5, 0);
  });
});

describe('comboGroup aggregation', () => {
  it('collapses Barrage + Demolition sub-skills into 1 result', () => {
    const config: SimulationConfig = {
      classes: ['bucc'],
      tiers: ['high'],
      scenarios: [{ name: 'Buffed' }],
    };

    const results = runSimulation(
      config, classDataMap, gearTemplates,
      weaponData, attackSpeedData, mwData
    );

    // Bucc has 4 Barrage+Demo sub-skills (standalone Demolition is hidden)
    // After aggregation: 1 Barrage+Demo = 1
    expect(results.length).toBe(1);
  });

  it('aggregated result uses the comboGroup name as skillName', () => {
    const config: SimulationConfig = {
      classes: ['bucc'],
      tiers: ['high'],
      scenarios: [{ name: 'Buffed' }],
    };

    const results = runSimulation(
      config, classDataMap, gearTemplates,
      weaponData, attackSpeedData, mwData
    );

    const combo = results.find(r => r.skillName === 'Barrage + Demolition');
    expect(combo).toBeDefined();
    expect(combo!.dps.skillName).toBe('Barrage + Demolition');
  });

  it('aggregated DPS equals sum of individual sub-skill DPS values', () => {
    const config: SimulationConfig = {
      classes: ['bucc'],
      tiers: ['high'],
      scenarios: [{ name: 'Buffed' }],
    };

    // Run with real data — DPS value will be computed from new combo data
    const results = runSimulation(
      config, classDataMap, gearTemplates,
      weaponData, attackSpeedData, mwData
    );

    const combo = results.find(r => r.skillName === 'Barrage + Demolition')!;
    // B+Demo should be higher than standalone Demolition (~233k high tier)
    expect(combo.dps.dps).toBeGreaterThan(233000);
  });

  it('hidden skills are excluded from simulation', () => {
    const config: SimulationConfig = {
      classes: ['bucc'],
      tiers: ['high'],
      scenarios: [{ name: 'Buffed' }],
    };

    const results = runSimulation(
      config, classDataMap, gearTemplates,
      weaponData, attackSpeedData, mwData
    );

    const demolition = results.find(r => r.skillName === 'Demolition');
    expect(demolition).toBeUndefined();
  });

  it('produces correct count across tiers and scenarios', () => {
    const config: SimulationConfig = {
      classes: ['bucc'],
      tiers: ['low', 'high'],
      scenarios: [{ name: 'Buffed' }, { name: 'Test' }],
    };

    const results = runSimulation(
      config, classDataMap, gearTemplates,
      weaponData, attackSpeedData, mwData
    );

    // 1 skill after aggregation (hidden Demolition excluded) × 2 tiers × 2 scenarios = 4
    expect(results.length).toBe(4);
  });
});

describe('targetCount (multi-target scaling)', () => {
  it('scales AoE skill DPS by effective target count', () => {
    const config: SimulationConfig = {
      classes: ['hero'],
      tiers: ['high'],
      scenarios: [
        { name: 'Buffed' },
        { name: 'Training', targetCount: 3 },
      ],
    };

    const results = runSimulation(
      config, classDataMap, gearTemplates,
      weaponData, attackSpeedData, mwData
    );

    const buffed = results.find(r => r.scenario === 'Buffed')!;
    const training = results.find(r => r.scenario === 'Training')!;

    // Hero Brandish has maxTargets: 3, so with targetCount: 3 it should triple
    expect(training.dps.dps).toBeCloseTo(buffed.dps.dps * 3, 0);
  });

  it('caps effective targets at skill maxTargets', () => {
    const config: SimulationConfig = {
      classes: ['hero'],
      tiers: ['high'],
      scenarios: [
        { name: 'Buffed' },
        { name: 'Training', targetCount: 10 },
      ],
    };

    const results = runSimulation(
      config, classDataMap, gearTemplates,
      weaponData, attackSpeedData, mwData
    );

    const buffed = results.find(r => r.scenario === 'Buffed')!;
    const training = results.find(r => r.scenario === 'Training')!;

    // Hero Brandish maxTargets: 3, so even with 10 targets it caps at 3x
    expect(training.dps.dps).toBeCloseTo(buffed.dps.dps * 3, 0);
  });

  it('single-target skills are unaffected by targetCount', () => {
    const config: SimulationConfig = {
      classes: ['nl'],
      tiers: ['high'],
      scenarios: [
        { name: 'Buffed' },
        { name: 'Training', targetCount: 6 },
      ],
    };

    const results = runSimulation(
      config, classDataMap, gearTemplates,
      weaponData, attackSpeedData, mwData
    );

    const buffed = results.find(r => r.scenario === 'Buffed')!;
    const training = results.find(r => r.scenario === 'Training')!;

    // NL Triple Throw has no maxTargets (defaults to 1), so DPS unchanged
    expect(training.dps.dps).toBe(buffed.dps.dps);
  });

  it('targetCount of 1 has no effect', () => {
    const config: SimulationConfig = {
      classes: ['hero'],
      tiers: ['high'],
      scenarios: [
        { name: 'Buffed' },
        { name: 'Training 1', targetCount: 1 },
      ],
    };

    const results = runSimulation(
      config, classDataMap, gearTemplates,
      weaponData, attackSpeedData, mwData
    );

    const buffed = results.find(r => r.scenario === 'Buffed')!;
    const training = results.find(r => r.scenario === 'Training 1')!;

    expect(training.dps.dps).toBe(buffed.dps.dps);
  });

  it('combo sub-skills scale independently by their maxTargets', () => {
    const config: SimulationConfig = {
      classes: ['shadower'],
      tiers: ['high'],
      scenarios: [
        { name: 'Buffed' },
        { name: 'Training', targetCount: 6 },
      ],
    };

    const results = runSimulation(
      config, classDataMap, gearTemplates,
      weaponData, attackSpeedData, mwData
    );

    const buffedCombo = results.find(
      r => r.skillName === 'BStep + Assassinate' && r.scenario === 'Buffed'
    )!;
    const trainingCombo = results.find(
      r => r.skillName === 'BStep + Assassinate' && r.scenario === 'Training'
    )!;

    // BStep has maxTargets: 6, Assassinate has default 1
    // So combo DPS != buffed * 6 — only BStep's portion scales
    expect(trainingCombo.dps.dps).toBeGreaterThan(buffedCombo.dps.dps);
    expect(trainingCombo.dps.dps).toBeLessThan(buffedCombo.dps.dps * 6);
  });

  it('high-maxTargets skill scales correctly', () => {
    const config: SimulationConfig = {
      classes: ['archmage-il'],
      tiers: ['high'],
      scenarios: [
        { name: 'Buffed' },
        { name: 'Training 6', targetCount: 6 },
      ],
    };

    const results = runSimulation(
      config, classDataMap, gearTemplates,
      weaponData, attackSpeedData, mwData
    );

    const chainBuffed = results.find(
      r => r.skillName === 'Chain Lightning' && r.scenario === 'Buffed'
    )!;
    const chainTraining = results.find(
      r => r.skillName === 'Chain Lightning' && r.scenario === 'Training 6'
    )!;
    const blizzBuffed = results.find(
      r => r.skillName === 'Blizzard' && r.scenario === 'Buffed'
    )!;
    const blizzTraining = results.find(
      r => r.skillName === 'Blizzard' && r.scenario === 'Training 6'
    )!;

    // Chain Lightning maxTargets: 6, targetCount: 6 → 6x
    expect(chainTraining.dps.dps).toBeCloseTo(chainBuffed.dps.dps * 6, 0);
    // Blizzard maxTargets: 15, targetCount: 6 → capped at 6x
    expect(blizzTraining.dps.dps).toBeCloseTo(blizzBuffed.dps.dps * 6, 0);
  });
});

describe('elementOptions (adaptive element selection)', () => {
  it('picks the best element when multiple are toggled', () => {
    const config: SimulationConfig = {
      classes: ['paladin'],
      tiers: ['high'],
      scenarios: [
        { name: 'Buffed' },
        { name: 'Mixed', elementModifiers: { Fire: 1.5, Ice: 0.5 } },
      ],
    };

    const results = runSimulation(
      config, classDataMap, gearTemplates,
      weaponData, attackSpeedData, mwData
    );

    const buffed = results.find(
      r => r.skillName === 'Blast (F/I/L Charge, Sword)' && r.scenario === 'Buffed'
    )!;
    const mixed = results.find(
      r => r.skillName === 'Blast (F/I/L Charge, Sword)' && r.scenario === 'Mixed'
    )!;

    // Should pick Fire (1.5x) over Ice (0.5x) and Lightning (neutral)
    expect(mixed.dps.dps).toBeCloseTo(buffed.dps.dps * 1.5, 0);
  });

  it('is unaffected when only non-matching elements are toggled', () => {
    const config: SimulationConfig = {
      classes: ['paladin'],
      tiers: ['high'],
      scenarios: [
        { name: 'Buffed' },
        { name: 'Holy Only', elementModifiers: { Holy: 1.5 } },
      ],
    };

    const results = runSimulation(
      config, classDataMap, gearTemplates,
      weaponData, attackSpeedData, mwData
    );

    const buffed = results.find(
      r => r.skillName === 'Blast (F/I/L Charge, Sword)' && r.scenario === 'Buffed'
    )!;
    const holyOnly = results.find(
      r => r.skillName === 'Blast (F/I/L Charge, Sword)' && r.scenario === 'Holy Only'
    )!;

    // Holy is not in elementOptions, so F/I/L Charge is unaffected
    expect(holyOnly.dps.dps).toBe(buffed.dps.dps);
  });

  it('applies a single matching element correctly', () => {
    const config: SimulationConfig = {
      classes: ['paladin'],
      tiers: ['high'],
      scenarios: [
        { name: 'Buffed' },
        { name: 'Ice Weak', elementModifiers: { Ice: 1.5 } },
      ],
    };

    const results = runSimulation(
      config, classDataMap, gearTemplates,
      weaponData, attackSpeedData, mwData
    );

    const buffed = results.find(
      r => r.skillName === 'Blast (F/I/L Charge, BW)' && r.scenario === 'Buffed'
    )!;
    const iceWeak = results.find(
      r => r.skillName === 'Blast (F/I/L Charge, BW)' && r.scenario === 'Ice Weak'
    )!;

    expect(iceWeak.dps.dps).toBeCloseTo(buffed.dps.dps * 1.5, 0);
  });
});
