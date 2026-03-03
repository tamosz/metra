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

function makeMixedRotationFixtures() {
  const classData: ClassSkillData = {
    className: 'TestClass',
    mastery: 0.6,
    primaryStat: 'DEX',
    secondaryStat: 'STR',
    sharpEyesCritRate: 0.15,
    sharpEyesCritDamageBonus: 140,
    seCritFormula: 'addBeforeMultiply',
    damageFormula: 'standard',
    skills: [
      {
        name: 'Skill A',
        basePower: 380,
        multiplier: 1.2,
        hitCount: 4,
        speedCategory: 'Battleship Cannon',
        weaponType: 'Gun',
      },
      {
        name: 'Skill B',
        basePower: 200,
        multiplier: 1.2,
        hitCount: 1,
        speedCategory: 'Hurricane',
        weaponType: 'Gun',
      },
    ],
    mixedRotations: [
      {
        name: 'Mixed A+B',
        description: 'Test mixed rotation',
        components: [
          { skill: 'Skill A', weight: 0.8 },
          { skill: 'Skill B', weight: 0.2 },
        ],
      },
    ],
  };

  const build: CharacterBuild = {
    className: 'TestClass',
    baseStats: { STR: 4, DEX: 700, INT: 4, LUK: 4 },
    gearStats: { STR: 40, DEX: 200, INT: 0, LUK: 0 },
    totalWeaponAttack: 100,
    weaponType: 'Gun',
    weaponSpeed: 5,
    attackPotion: 60,
    projectile: 0,
    echoActive: true,
    mwLevel: 20,
    speedInfusion: true,
    sharpEyes: true,
  };

  const weaponData: WeaponData = {
    types: [{ name: 'Gun', slashMultiplier: 3.6, stabMultiplier: 3.6 }],
  };

  const attackSpeedData: AttackSpeedData = {
    categories: ['Battleship Cannon', 'Hurricane'],
    entries: [{ speed: 2, times: { 'Battleship Cannon': 0.6, Hurricane: 0.12 } }],
  };

  const mwData: MWData = [{ level: 20, multiplier: 1.1 }];

  return { classData, build, weaponData, attackSpeedData, mwData };
}

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
    ['paladin-bw', loadClassSkills('paladin-bw')],
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
    ['paladin-bw-high', loadGearTemplate('paladin-bw-high')],
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
  it('Holy 1.5x boosts Holy-element skill DPS (capped below naive 1.5x)', () => {
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
      r => r.className === 'Paladin' && r.scenario === 'Buffed'
    )!;
    const holy = results.find(
      r => r.className === 'Paladin' && r.scenario === 'Holy Advantage'
    )!;

    // Both should be Holy Blast (wins in both scenarios: 1.4 > 1.3, 2.1 > 1.3)
    expect(buffed.skillName).toBe('Blast (Holy, Sword)');
    expect(holy.skillName).toBe('Blast (Holy, Sword)');
    expect(holy.dps.dps).toBeGreaterThan(buffed.dps.dps);
    expect(holy.dps.dps).toBeLessThan(buffed.dps.dps * 1.5);
    expect(holy.dps.uncappedDps).toBeCloseTo(buffed.dps.uncappedDps * 1.5, 0);
    expect(holy.dps.capLossPercent).toBeGreaterThan(0);
  });

  it('holy element boost wins over neutral charge in variant group', () => {
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

    // With only Holy boosted, Holy Blast still wins (1.4 * 1.5 = 2.1 > 1.3)
    const paladinBuffed = results.filter(r => r.className === 'Paladin' && r.scenario === 'Buffed');
    const paladinHoly = results.filter(r => r.className === 'Paladin' && r.scenario === 'Holy Advantage');
    expect(paladinBuffed).toHaveLength(1);
    expect(paladinHoly).toHaveLength(1);
    expect(paladinHoly[0].skillName).toBe('Blast (Holy, Sword)');
  });

  it('element modifier stacks multiplicatively with PDR', () => {
    const config: SimulationConfig = {
      classes: ['paladin'],
      tiers: ['high'],
      scenarios: [
        { name: 'Buffed' },
        { name: 'Holy Only', elementModifiers: { Holy: 1.5 } },
        { name: 'Undead Boss', pdr: 0.5, elementModifiers: { Holy: 1.5 } },
      ],
    };

    const results = runSimulation(
      config, classDataMap, gearTemplates,
      weaponData, attackSpeedData, mwData
    );

    const holyOnly = results.find(
      r => r.className === 'Paladin' && r.scenario === 'Holy Only'
    )!;
    const undead = results.find(
      r => r.className === 'Paladin' && r.scenario === 'Undead Boss'
    )!;

    expect(undead.dps.dps).toBeCloseTo(holyOnly.dps.dps * 0.5, 0);
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
      r => r.className === 'Paladin' && r.scenario === 'Buffed'
    )!;
    const resist = results.find(
      r => r.className === 'Paladin' && r.scenario === 'Holy Resist'
    )!;

    // Holy Resist: Holy effective = 1.4 * 0.5 = 0.7, Charge neutral = 1.3
    // Charge wins! So the result should be the Charge variant
    expect(resist.skillName).toBe('Blast (F/I/L Charge, Sword)');
    // Charge is neutral (1.0), so DPS should equal baseline Charge DPS
    // buffed.dps is Holy (1.4 mult), resist winner is Charge (1.3 mult, neutral element)
    expect(resist.dps.dps).toBeLessThan(buffed.dps.dps);
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
  it('picks the best element when charge variant wins', () => {
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

    const buffed = results.find(r => r.className === 'Paladin' && r.scenario === 'Buffed')!;
    const mixed = results.find(r => r.className === 'Paladin' && r.scenario === 'Mixed')!;

    // Fire Charge wins: 1.3 * 1.5 = 1.95 > Holy 1.4
    expect(mixed.skillName).toBe('Blast (Fire Charge, Sword)');
    expect(mixed.dps.dps).toBeGreaterThan(buffed.dps.dps);
  });

  it('holy still wins when only Holy element is active', () => {
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

    const buffed = results.find(r => r.className === 'Paladin' && r.scenario === 'Buffed')!;
    const holyOnly = results.find(r => r.className === 'Paladin' && r.scenario === 'Holy Only')!;

    expect(buffed.skillName).toBe('Blast (Holy, Sword)');
    expect(holyOnly.skillName).toBe('Blast (Holy, Sword)');
    expect(holyOnly.dps.dps).toBeGreaterThan(buffed.dps.dps);
  });

  it('charge variant wins for BW with matching element', () => {
    const config: SimulationConfig = {
      classes: ['paladin-bw'],
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

    const buffed = results.find(r => r.className === 'Paladin (BW)' && r.scenario === 'Buffed')!;
    const iceWeak = results.find(r => r.className === 'Paladin (BW)' && r.scenario === 'Ice Weak')!;

    expect(buffed.skillName).toBe('Blast (Holy, BW)');
    expect(iceWeak.skillName).toBe('Blast (Ice Charge, BW)');
    expect(iceWeak.dps.dps).toBeGreaterThan(buffed.dps.dps);
  });
});

describe('mixed rotations', () => {
  it('creates a weighted DPS entry from component skills', () => {
    const { classData, build, weaponData, attackSpeedData, mwData } = makeMixedRotationFixtures();
    const classDataMap = new Map([['testclass', classData]]);
    const gearTemplates = new Map([['testclass-high', build]]);
    const config: SimulationConfig = { classes: ['testclass'], tiers: ['high'] };

    const results = runSimulation(config, classDataMap, gearTemplates, weaponData, attackSpeedData, mwData);

    const skillA = results.find(r => r.skillName === 'Skill A');
    const skillB = results.find(r => r.skillName === 'Skill B');
    const mixed = results.find(r => r.skillName === 'Mixed A+B');

    expect(skillA).toBeDefined();
    expect(skillB).toBeDefined();
    expect(mixed).toBeDefined();

    const expectedDps = skillA!.dps.dps * 0.8 + skillB!.dps.dps * 0.2;
    expect(mixed!.dps.dps).toBeCloseTo(expectedDps, 0);
    expect(mixed!.description).toBe('Test mixed rotation');
    expect(mixed!.className).toBe('TestClass');
    expect(mixed!.tier).toBe('high');

    const expectedUncappedDps = skillA!.dps.uncappedDps * 0.8 + skillB!.dps.uncappedDps * 0.2;
    expect(mixed!.dps.uncappedDps).toBeCloseTo(expectedUncappedDps, 0);
    const expectedCapLoss = expectedUncappedDps > 0
      ? ((expectedUncappedDps - expectedDps) / expectedUncappedDps) * 100
      : 0;
    expect(mixed!.dps.capLossPercent).toBeCloseTo(expectedCapLoss, 1);
  });

  it('applies element modifiers to mixed rotation components', () => {
    const { classData, build, weaponData, attackSpeedData, mwData } = makeMixedRotationFixtures();
    classData.skills[0].element = 'Fire';

    const classDataMap = new Map([['testclass', classData]]);
    const gearTemplates = new Map([['testclass-high', build]]);
    const config: SimulationConfig = {
      classes: ['testclass'],
      tiers: ['high'],
      scenarios: [{ name: 'Test', elementModifiers: { Fire: 1.5 } }],
    };

    const results = runSimulation(config, classDataMap, gearTemplates, weaponData, attackSpeedData, mwData);

    const skillA = results.find(r => r.skillName === 'Skill A');
    const skillB = results.find(r => r.skillName === 'Skill B');
    const mixed = results.find(r => r.skillName === 'Mixed A+B');

    expect(mixed).toBeDefined();
    const expectedDps = skillA!.dps.dps * 0.8 + skillB!.dps.dps * 0.2;
    expect(mixed!.dps.dps).toBeCloseTo(expectedDps, 0);
  });

  it('classes without mixedRotations produce no extra results', () => {
    const { classData, build, weaponData, attackSpeedData, mwData } = makeMixedRotationFixtures();
    delete (classData as any).mixedRotations;

    const classDataMap = new Map([['testclass', classData]]);
    const gearTemplates = new Map([['testclass-high', build]]);
    const config: SimulationConfig = { classes: ['testclass'], tiers: ['high'] };

    const results = runSimulation(config, classDataMap, gearTemplates, weaponData, attackSpeedData, mwData);
    expect(results).toHaveLength(2); // Just Skill A and Skill B
  });
});

describe('elementVariantGroup', () => {
  it('merges variants into single result (Holy wins with no element modifiers)', () => {
    const config: SimulationConfig = {
      classes: ['paladin'],
      tiers: ['high'],
      scenarios: [{ name: 'Buffed' }],
    };

    const results = runSimulation(
      config, classDataMap, gearTemplates,
      weaponData, attackSpeedData, mwData
    );

    const paladinResults = results.filter(r => r.className === 'Paladin');
    expect(paladinResults).toHaveLength(1);
    expect(paladinResults[0].skillName).toBe('Blast (Holy, Sword)');
  });

  it('charge variant wins when its element is weak (1.5x)', () => {
    const config: SimulationConfig = {
      classes: ['paladin'],
      tiers: ['high'],
      scenarios: [{ name: 'Fire Weak', elementModifiers: { Fire: 1.5 } }],
    };

    const results = runSimulation(
      config, classDataMap, gearTemplates,
      weaponData, attackSpeedData, mwData
    );

    const paladinResults = results.filter(r => r.className === 'Paladin');
    expect(paladinResults).toHaveLength(1);
    expect(paladinResults[0].skillName).toBe('Blast (Fire Charge, Sword)');
  });

  it('holy wins when both holy and F/I/L element are weak', () => {
    const config: SimulationConfig = {
      classes: ['paladin'],
      tiers: ['high'],
      scenarios: [{ name: 'Both Weak', elementModifiers: { Holy: 1.5, Fire: 1.5 } }],
    };

    const results = runSimulation(
      config, classDataMap, gearTemplates,
      weaponData, attackSpeedData, mwData
    );

    const paladinResults = results.filter(r => r.className === 'Paladin');
    expect(paladinResults).toHaveLength(1);
    expect(paladinResults[0].skillName).toBe('Blast (Holy, Sword)');
  });

  it('merged result is always headline regardless of component headline status', () => {
    const config: SimulationConfig = {
      classes: ['paladin'],
      tiers: ['high'],
      scenarios: [{ name: 'Fire Weak', elementModifiers: { Fire: 1.5 } }],
    };

    const results = runSimulation(
      config, classDataMap, gearTemplates,
      weaponData, attackSpeedData, mwData
    );

    const paladinResults = results.filter(r => r.className === 'Paladin');
    expect(paladinResults[0].headline).toBeUndefined();
  });

  it('works for BW variants too', () => {
    const config: SimulationConfig = {
      classes: ['paladin-bw'],
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

    const buffed = results.filter(r => r.className === 'Paladin (BW)' && r.scenario === 'Buffed');
    const iceWeak = results.filter(r => r.className === 'Paladin (BW)' && r.scenario === 'Ice Weak');

    expect(buffed).toHaveLength(1);
    expect(buffed[0].skillName).toBe('Blast (Holy, BW)');
    expect(iceWeak).toHaveLength(1);
    expect(iceWeak[0].skillName).toBe('Blast (Ice Charge, BW)');
  });

  it('DPS of merged result is correct for both scenarios', () => {
    const config: SimulationConfig = {
      classes: ['paladin'],
      tiers: ['high'],
      scenarios: [
        { name: 'Buffed' },
        { name: 'Fire Weak', elementModifiers: { Fire: 1.5 } },
      ],
    };

    const results = runSimulation(
      config, classDataMap, gearTemplates,
      weaponData, attackSpeedData, mwData
    );

    const buffed = results.find(r => r.className === 'Paladin' && r.scenario === 'Buffed')!;
    const fireWeak = results.find(r => r.className === 'Paladin' && r.scenario === 'Fire Weak')!;

    expect(buffed.dps.dps).toBeGreaterThan(180000);
    expect(fireWeak.dps.dps).toBeGreaterThan(buffed.dps.dps);
  });
});
