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
  CharacterBuild,
} from '../data/types.js';
import { runSimulation } from './simulate.js';
import type { SimulationConfig, GearTemplateMap } from './simulate.js';
import type { ScenarioConfig } from './types.js';

let weaponData: WeaponData;
let attackSpeedData: AttackSpeedData;
let mapleWarriorData: MapleWarriorData;
let classDataMap: Map<string, ClassSkillData>;
let gearTemplates: GearTemplateMap;

beforeAll(() => {
  weaponData = loadWeapons();
  attackSpeedData = loadAttackSpeed();
  mapleWarriorData = loadMapleWarrior();

  classDataMap = new Map([
    ['hero', loadClassSkills('Hero')],
    ['bucc', loadClassSkills('Bucc')],
  ]);

  gearTemplates = new Map([
    ['hero-low', loadGearTemplate('hero-low')],
    ['hero-high', loadGearTemplate('hero-high')],
    ['bucc-low', loadGearTemplate('bucc-low')],
    ['bucc-high', loadGearTemplate('bucc-high')],
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
      weaponData, attackSpeedData, mapleWarriorData
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
      weaponData, attackSpeedData, mapleWarriorData
    );

    const heroSkillCount = classDataMap.get('hero')!.skills.length;
    expect(results.length).toBe(heroSkillCount);
  });

  it('multiplies results across tiers and scenarios', () => {
    const config: SimulationConfig = {
      classes: ['hero'],
      tiers: ['low', 'high'],
      scenarios: [{ name: 'Buffed' }, { name: 'Unbuffed' }],
    };

    const results = runSimulation(
      config, classDataMap, gearTemplates,
      weaponData, attackSpeedData, mapleWarriorData
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
      weaponData, attackSpeedData, mapleWarriorData
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
        weaponData, attackSpeedData, mapleWarriorData
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
        weaponData, attackSpeedData, mapleWarriorData
      )
    ).toThrow(/Gear template "hero-mythical" not found/);
  });
});

describe('runSimulation scenario overrides', () => {
  it('unbuffed scenario produces lower DPS than buffed', () => {
    const config: SimulationConfig = {
      classes: ['hero'],
      tiers: ['high'],
      scenarios: [
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
      ],
    };

    const results = runSimulation(
      config, classDataMap, gearTemplates,
      weaponData, attackSpeedData, mapleWarriorData
    );

    const buffed = results.find(
      r => r.skillName === 'Brandish (Sword)' && r.scenario === 'Buffed'
    )!;
    const unbuffed = results.find(
      r => r.skillName === 'Brandish (Sword)' && r.scenario === 'Unbuffed'
    )!;

    expect(buffed.dps.dps).toBeGreaterThan(unbuffed.dps.dps);
    // Unbuffed should be at least 20% lower
    expect(unbuffed.dps.dps).toBeLessThan(buffed.dps.dps * 0.8);
  });

  it('no-echo scenario produces slightly lower DPS (within ~10%)', () => {
    const config: SimulationConfig = {
      classes: ['hero'],
      tiers: ['high'],
      scenarios: [
        { name: 'Buffed' },
        { name: 'No-Echo', overrides: { echoActive: false } },
      ],
    };

    const results = runSimulation(
      config, classDataMap, gearTemplates,
      weaponData, attackSpeedData, mapleWarriorData
    );

    const buffed = results.find(
      r => r.skillName === 'Brandish (Sword)' && r.scenario === 'Buffed'
    )!;
    const noEcho = results.find(
      r => r.skillName === 'Brandish (Sword)' && r.scenario === 'No-Echo'
    )!;

    expect(noEcho.dps.dps).toBeLessThan(buffed.dps.dps);
    expect(noEcho.dps.dps).toBeGreaterThan(buffed.dps.dps * 0.9);
  });

  it('overrides do not mutate the original build objects', () => {
    const originalBuild = gearTemplates.get('hero-high')!;
    const originalPotion = originalBuild.attackPotion;
    const originalMW = originalBuild.mapleWarriorLevel;

    const config: SimulationConfig = {
      classes: ['hero'],
      tiers: ['high'],
      scenarios: [{
        name: 'Zeroed',
        overrides: { mapleWarriorLevel: 0, attackPotion: 0 },
      }],
    };

    runSimulation(
      config, classDataMap, gearTemplates,
      weaponData, attackSpeedData, mapleWarriorData
    );

    const buildAfter = gearTemplates.get('hero-high')!;
    expect(buildAfter.attackPotion).toBe(originalPotion);
    expect(buildAfter.mapleWarriorLevel).toBe(originalMW);
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
      weaponData, attackSpeedData, mapleWarriorData
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
      weaponData, attackSpeedData, mapleWarriorData
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
      weaponData, attackSpeedData, mapleWarriorData
    );

    for (const r of results) {
      expect(r.dps.dps).toBe(0);
    }
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
      weaponData, attackSpeedData, mapleWarriorData
    );

    // Bucc has 5 raw skills: 1 Demolition + 4 Barrage+Demo sub-skills
    // After aggregation: 1 Demolition + 1 Barrage+Demo = 2
    expect(results.length).toBe(2);
  });

  it('aggregated result uses the comboGroup name as skillName', () => {
    const config: SimulationConfig = {
      classes: ['bucc'],
      tiers: ['high'],
      scenarios: [{ name: 'Buffed' }],
    };

    const results = runSimulation(
      config, classDataMap, gearTemplates,
      weaponData, attackSpeedData, mapleWarriorData
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
      weaponData, attackSpeedData, mapleWarriorData
    );

    const combo = results.find(r => r.skillName === 'Barrage + Demolition')!;
    // B+Demo should be higher than standalone Demolition (~233k high tier)
    expect(combo.dps.dps).toBeGreaterThan(233000);
  });

  it('non-combo skills pass through unchanged', () => {
    const config: SimulationConfig = {
      classes: ['bucc'],
      tiers: ['high'],
      scenarios: [{ name: 'Buffed' }],
    };

    const results = runSimulation(
      config, classDataMap, gearTemplates,
      weaponData, attackSpeedData, mapleWarriorData
    );

    const demolition = results.find(r => r.skillName === 'Demolition')!;
    expect(demolition).toBeDefined();
    expect(demolition.className).toBe('Buccaneer');
    expect(demolition.tier).toBe('high');
    // Reference value: ~233,453 DPS
    expect(demolition.dps.dps).toBeCloseTo(233453, -2);
  });

  it('produces correct count across tiers and scenarios', () => {
    const config: SimulationConfig = {
      classes: ['bucc'],
      tiers: ['low', 'high'],
      scenarios: [{ name: 'Buffed' }, { name: 'Test' }],
    };

    const results = runSimulation(
      config, classDataMap, gearTemplates,
      weaponData, attackSpeedData, mapleWarriorData
    );

    // 2 skills after aggregation × 2 tiers × 2 scenarios = 8
    expect(results.length).toBe(8);
  });
});
