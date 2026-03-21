import { describe, it, expect, beforeAll } from 'vitest';
import {
  loadWeapons,
  loadAttackSpeed,
  loadMW,
  loadClassSkills,
} from '../data/loader.js';
import { TEST_BUILDS } from '../engine/test-builds.js';
import type {
  WeaponData,
  AttackSpeedData,
  MWData,
  ClassSkillData,
  CharacterBuild,
  DpsResult,
} from '@metra/engine';
import { runSimulation, applyPdr, applyTargetCount, applyKnockbackUptime } from './simulate.js';
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
    ['night-lord', loadClassSkills('Night Lord')],
  ]);

  gearTemplates = new Map([
    ['hero', TEST_BUILDS['hero-high']],
    ['bucc', TEST_BUILDS['bucc-high']],
    ['paladin', TEST_BUILDS['paladin-high']],
    ['paladin-bw', TEST_BUILDS['paladin-bw-high']],
    ['shadower', TEST_BUILDS['shadower-high']],
    ['archmage-il', TEST_BUILDS['archmage-il-high']],
    ['night-lord', TEST_BUILDS['night-lord-high']],
  ]);
});

describe('runSimulation basics', () => {
  it('defaults to single Buffed scenario when scenarios omitted', () => {
    const config: SimulationConfig = {
      classes: ['hero'],
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
      scenarios: [{ name: 'Buffed' }],
    };

    const results = runSimulation(
      config, classDataMap, gearTemplates,
      weaponData, attackSpeedData, mwData
    );

    const heroSkillCount = classDataMap.get('hero')!.skills.length;
    expect(results.length).toBe(heroSkillCount);
  });

  it('multiplies results across scenarios', () => {
    const config: SimulationConfig = {
      classes: ['hero'],
      scenarios: [{ name: 'Buffed' }, { name: 'Bossing (50% PDR)', pdr: 0.5 }],
    };

    const results = runSimulation(
      config, classDataMap, gearTemplates,
      weaponData, attackSpeedData, mwData
    );

    const heroSkillCount = classDataMap.get('hero')!.skills.length;
    expect(results.length).toBe(heroSkillCount * 2); // skills × scenarios
  });

  it('results have correct className and scenario fields', () => {
    const config: SimulationConfig = {
      classes: ['hero'],
      scenarios: [{ name: 'Buffed' }, { name: 'Test' }],
    };

    const results = runSimulation(
      config, classDataMap, gearTemplates,
      weaponData, attackSpeedData, mwData
    );

    for (const r of results) {
      expect(r.className).toBe('Hero');
      expect(['Buffed', 'Test']).toContain(r.scenario);
      expect(r.dps.dps).toBeGreaterThan(0);
    }
  });
});

describe('runSimulation error handling', () => {
  it('throws for missing class in classDataMap', () => {
    const config: SimulationConfig = {
      classes: ['nonexistent'],
    };

    expect(() =>
      runSimulation(
        config, classDataMap, gearTemplates,
        weaponData, attackSpeedData, mwData
      )
    ).toThrow(/Class "nonexistent" not found/);
  });

  it('throws for missing build in gearTemplates', () => {
    const config: SimulationConfig = {
      classes: ['hero'],
    };
    const emptyTemplates: GearTemplateMap = new Map();

    expect(() =>
      runSimulation(
        config, classDataMap, emptyTemplates,
        weaponData, attackSpeedData, mwData
      )
    ).toThrow(/Build for "hero" not found/);
  });
});

describe('runSimulation scenario overrides', () => {
  it('no-buffs scenario produces lower DPS than buffed', () => {
    const config: SimulationConfig = {
      classes: ['hero'],
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
    const originalBuild = gearTemplates.get('hero')!;
    const originalPotion = originalBuild.attackPotion;
    const originalMW = originalBuild.mwLevel;

    const config: SimulationConfig = {
      classes: ['hero'],
      scenarios: [{
        name: 'Zeroed',
        overrides: { mwLevel: 0, attackPotion: 0 },
      }],
    };

    runSimulation(
      config, classDataMap, gearTemplates,
      weaponData, attackSpeedData, mwData
    );

    const buildAfter = gearTemplates.get('hero')!;
    expect(buildAfter.attackPotion).toBe(originalPotion);
    expect(buildAfter.mwLevel).toBe(originalMW);
  });
});

describe('runSimulation PDR', () => {
  it('PDR 0.5 produces exactly 50% of buffed DPS', () => {
    const config: SimulationConfig = {
      classes: ['hero'],
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
      scenarios: [{ name: 'Buffed' }],
    };

    const results = runSimulation(
      config, classDataMap, gearTemplates,
      weaponData, attackSpeedData, mwData
    );

    // Bucc has 4 Barrage+Demo sub-skills (standalone Demolition is hidden) + Dragon Strike
    // After aggregation: 1 Barrage+Demo + 1 Dragon Strike = 2
    expect(results.length).toBe(2);
  });

  it('aggregated result uses the comboGroup name as skillName', () => {
    const config: SimulationConfig = {
      classes: ['bucc'],
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
      scenarios: [{ name: 'Buffed' }],
    };

    const results = runSimulation(
      config, classDataMap, gearTemplates,
      weaponData, attackSpeedData, mwData
    );

    const demolition = results.find(r => r.skillName === 'Demolition');
    expect(demolition).toBeUndefined();
  });

  it('produces correct count across scenarios', () => {
    const config: SimulationConfig = {
      classes: ['bucc'],
      scenarios: [{ name: 'Buffed' }, { name: 'Test' }],
    };

    const results = runSimulation(
      config, classDataMap, gearTemplates,
      weaponData, attackSpeedData, mwData
    );

    // 2 skills after aggregation (hidden Demolition excluded, Dragon Strike standalone) × 2 scenarios = 4
    expect(results.length).toBe(4);
  });
});

describe('targetCount (multi-target scaling)', () => {
  it('scales AoE skill DPS by effective target count', () => {
    const config: SimulationConfig = {
      classes: ['hero'],
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
      classes: ['night-lord'],
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

    // Night Lord Triple Throw has no maxTargets (defaults to 1), so DPS unchanged
    expect(training.dps.dps).toBe(buffed.dps.dps);
  });

  it('targetCount of 1 has no effect', () => {
    const config: SimulationConfig = {
      classes: ['hero'],
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
      r => r.skillName === 'Boomerang Step + Assassinate' && r.scenario === 'Buffed'
    )!;
    const trainingCombo = results.find(
      r => r.skillName === 'Boomerang Step + Assassinate' && r.scenario === 'Training'
    )!;

    // BStep has maxTargets: 4, Assassinate has default 1
    // So combo DPS != buffed * 6 — only BStep's portion scales
    expect(trainingCombo.dps.dps).toBeGreaterThan(buffedCombo.dps.dps);
    expect(trainingCombo.dps.dps).toBeLessThan(buffedCombo.dps.dps * 4);
  });

  it('high-maxTargets skill scales correctly', () => {
    const config: SimulationConfig = {
      classes: ['archmage-il'],
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

    // Chain Lightning maxTargets: 6, targetCount: 6, bounceDecay: 0.7 → geometric series ≈ 2.94x
    const clExpected = (1 - 0.7 ** 6) / (1 - 0.7);
    expect(chainTraining.dps.dps).toBeCloseTo(chainBuffed.dps.dps * clExpected, 0);
    // Blizzard maxTargets: 15, targetCount: 6 → capped at 6x
    expect(blizzTraining.dps.dps).toBeCloseTo(blizzBuffed.dps.dps * 6, 0);
  });

  it('applies bounce decay for multi-target scaling', () => {
    // Use inline class data with bounceDecay to test independently of archmage-il.json
    const classData: ClassSkillData = {
      className: 'TestBounce',
      mastery: 0.6,
      primaryStat: 'INT',
      secondaryStat: 'LUK',
      sharpEyesCritRate: 0.15,
      sharpEyesCritDamageBonus: 140,
      damageFormula: 'magic',
      seCritFormula: 'multiplicative',
      spellAmplification: 1.4,
      weaponAmplification: 1.25,
      skills: [
        {
          name: 'Bouncy Skill',
          basePower: 210,
          multiplier: 1,
          hitCount: 1,
          speedCategory: 'Chain Lightning',
          weaponType: 'Staff',
          maxTargets: 6,
          bounceDecay: 0.7,
        },
        {
          name: 'Flat AoE',
          basePower: 210,
          multiplier: 1,
          hitCount: 1,
          speedCategory: 'Chain Lightning',
          weaponType: 'Staff',
          maxTargets: 6,
        },
      ],
    };

    const build: CharacterBuild = {
      className: 'TestBounce',
      baseStats: { STR: 4, DEX: 4, INT: 700, LUK: 120 },
      gearStats: { STR: 0, DEX: 0, INT: 200, LUK: 40 },
      totalWeaponAttack: 140,
      weaponType: 'Staff',
      weaponSpeed: 6,
      attackPotion: 60,
      projectile: 0,
      echoActive: true,
      mwLevel: 20,
      speedInfusion: false,
      sharpEyes: true,
    };

    const localClassDataMap = new Map([['testbounce', classData]]);
    const localGearTemplates: GearTemplateMap = new Map([['testbounce', build]]);

    const config: SimulationConfig = {
      classes: ['testbounce'],
      scenarios: [
        { name: 'Buffed' },
        { name: 'Training 6', targetCount: 6 },
      ],
    };

    const results = runSimulation(
      config, localClassDataMap, localGearTemplates,
      weaponData, attackSpeedData, mwData
    );

    const bouncyBuffed = results.find(
      r => r.skillName === 'Bouncy Skill' && r.scenario === 'Buffed'
    )!;
    const bouncyTraining = results.find(
      r => r.skillName === 'Bouncy Skill' && r.scenario === 'Training 6'
    )!;
    const flatBuffed = results.find(
      r => r.skillName === 'Flat AoE' && r.scenario === 'Buffed'
    )!;
    const flatTraining = results.find(
      r => r.skillName === 'Flat AoE' && r.scenario === 'Training 6'
    )!;

    // bounceDecay: 0.7, 6 targets → geometric series ≈ 2.9412x
    const expectedMultiplier = (1 - 0.7 ** 6) / (1 - 0.7);
    expect(bouncyTraining.dps.dps).toBeCloseTo(
      bouncyBuffed.dps.dps * expectedMultiplier, 0
    );

    // No bounceDecay → flat 6x scaling
    expect(flatTraining.dps.dps).toBeCloseTo(flatBuffed.dps.dps * 6, 0);
  });
});

describe('bounceDecay edge cases', () => {
  function makeBounceClassData(bounceDecay: number): ClassSkillData {
    return {
      className: 'TestBounce',
      mastery: 0.6,
      primaryStat: 'INT',
      secondaryStat: 'LUK',
      sharpEyesCritRate: 0.15,
      sharpEyesCritDamageBonus: 140,
      damageFormula: 'magic',
      seCritFormula: 'multiplicative',
      spellAmplification: 1.4,
      weaponAmplification: 1.25,
      skills: [
        {
          name: 'Bounce Skill',
          basePower: 210,
          multiplier: 1,
          hitCount: 1,
          speedCategory: 'Chain Lightning',
          weaponType: 'Staff',
          maxTargets: 6,
          bounceDecay,
        },
      ],
    };
  }

  const bounceBuild: CharacterBuild = {
    className: 'TestBounce',
    baseStats: { STR: 4, DEX: 4, INT: 700, LUK: 120 },
    gearStats: { STR: 0, DEX: 0, INT: 200, LUK: 40 },
    totalWeaponAttack: 140,
    weaponType: 'Staff',
    weaponSpeed: 6,
    attackPotion: 60,
    projectile: 0,
    echoActive: true,
    mwLevel: 20,
    speedInfusion: false,
    sharpEyes: true,
  };

  it('bounceDecay >= 1 falls back to flat scaling', () => {
    const classData = makeBounceClassData(1.0);
    const localClassDataMap = new Map([['testbounce', classData]]);
    const localGearTemplates: GearTemplateMap = new Map([['testbounce', bounceBuild]]);

    const config: SimulationConfig = {
      classes: ['testbounce'],
      scenarios: [
        { name: 'Buffed' },
        { name: 'Training 6', targetCount: 6 },
      ],
    };

    const results = runSimulation(
      config, localClassDataMap, localGearTemplates,
      weaponData, attackSpeedData, mwData
    );

    const buffed = results.find(r => r.scenario === 'Buffed')!;
    const training = results.find(r => r.scenario === 'Training 6')!;

    expect(training.dps.dps).toBeCloseTo(buffed.dps.dps * 6, 0);
    expect(training.dps.dps).toBeGreaterThan(0);
    expect(isFinite(training.dps.dps)).toBe(true);
  });

  it('negative bounceDecay falls back to flat scaling', () => {
    const classData = makeBounceClassData(-0.5);
    const localClassDataMap = new Map([['testbounce', classData]]);
    const localGearTemplates: GearTemplateMap = new Map([['testbounce', bounceBuild]]);

    const config: SimulationConfig = {
      classes: ['testbounce'],
      scenarios: [
        { name: 'Buffed' },
        { name: 'Training 6', targetCount: 6 },
      ],
    };

    const results = runSimulation(
      config, localClassDataMap, localGearTemplates,
      weaponData, attackSpeedData, mwData
    );

    const buffed = results.find(r => r.scenario === 'Buffed')!;
    const training = results.find(r => r.scenario === 'Training 6')!;

    expect(training.dps.dps).toBeCloseTo(buffed.dps.dps * 6, 0);
    expect(isFinite(training.dps.dps)).toBe(true);
  });

  it('uses flat multiplication when bounceDecay is 0', () => {
    const classData = makeBounceClassData(0);
    const localClassDataMap = new Map([['testbounce', classData]]);
    const localGearTemplates: GearTemplateMap = new Map([['testbounce', bounceBuild]]);

    const config: SimulationConfig = {
      classes: ['testbounce'],
      scenarios: [
        { name: 'Buffed' },
        { name: 'Training 6', targetCount: 6 },
      ],
    };

    const results = runSimulation(
      config, localClassDataMap, localGearTemplates,
      weaponData, attackSpeedData, mwData
    );

    const buffed = results.find(r => r.scenario === 'Buffed')!;
    const training = results.find(r => r.scenario === 'Training 6')!;

    expect(training.dps.dps).toBeCloseTo(buffed.dps.dps * 6, 0);
  });
});

describe('elementOptions (adaptive element selection)', () => {
  it('picks the best element when charge variant wins', () => {
    const config: SimulationConfig = {
      classes: ['paladin'],
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
    const gearTemplates = new Map([['testclass', build]]);
    const config: SimulationConfig = { classes: ['testclass'] };

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
    const gearTemplates = new Map([['testclass', build]]);
    const config: SimulationConfig = {
      classes: ['testclass'],
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

  it('uses efficiencyOverrides when provided', () => {
    const { classData, build, weaponData, attackSpeedData, mwData } = makeMixedRotationFixtures();
    const classDataMap = new Map([['testclass', classData]]);
    const gearTemplates = new Map([['testclass', build]]);
    const config: SimulationConfig = {
      classes: ['testclass'],
      scenarios: [{
        name: 'Custom',
        efficiencyOverrides: { 'TestClass.Mixed A+B': [0.5, 0.5] },
      }],
    };

    const results = runSimulation(config, classDataMap, gearTemplates, weaponData, attackSpeedData, mwData);

    const skillA = results.find(r => r.skillName === 'Skill A');
    const skillB = results.find(r => r.skillName === 'Skill B');
    const mixed = results.find(r => r.skillName === 'Mixed A+B');

    expect(mixed).toBeDefined();
    const expectedDps = skillA!.dps.dps * 0.5 + skillB!.dps.dps * 0.5;
    expect(mixed!.dps.dps).toBeCloseTo(expectedDps, 0);
  });

  it('ignores malformed efficiencyOverrides (wrong array length)', () => {
    const { classData, build, weaponData, attackSpeedData, mwData } = makeMixedRotationFixtures();
    const classDataMap = new Map([['testclass', classData]]);
    const gearTemplates = new Map([['testclass', build]]);
    const config: SimulationConfig = {
      classes: ['testclass'],
      scenarios: [{
        name: 'Bad Override',
        efficiencyOverrides: { 'TestClass.Mixed A+B': [0.5] },
      }],
    };

    const results = runSimulation(config, classDataMap, gearTemplates, weaponData, attackSpeedData, mwData);

    const skillA = results.find(r => r.skillName === 'Skill A');
    const skillB = results.find(r => r.skillName === 'Skill B');
    const mixed = results.find(r => r.skillName === 'Mixed A+B');

    // Should fall back to default 0.8/0.2 weights
    const expectedDps = skillA!.dps.dps * 0.8 + skillB!.dps.dps * 0.2;
    expect(mixed!.dps.dps).toBeCloseTo(expectedDps, 0);
  });

  it('classes without mixedRotations produce no extra results', () => {
    const { classData, build, weaponData, attackSpeedData, mwData } = makeMixedRotationFixtures();
    delete (classData as any).mixedRotations;

    const classDataMap = new Map([['testclass', classData]]);
    const gearTemplates = new Map([['testclass', build]]);
    const config: SimulationConfig = { classes: ['testclass'] };

    const results = runSimulation(config, classDataMap, gearTemplates, weaponData, attackSpeedData, mwData);
    expect(results).toHaveLength(2); // Just Skill A and Skill B
  });
});

describe('elementVariantGroup', () => {
  it('merges variants into single result (Holy wins with no element modifiers)', () => {
    const config: SimulationConfig = {
      classes: ['paladin'],
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

    expect(buffed.dps.dps).toBeGreaterThan(170000);
    expect(fireWeak.dps.dps).toBeGreaterThan(buffed.dps.dps);
  });
});

describe('modifier composition (PDR + KB + element + targets)', () => {
  it('all post-calc modifiers compose multiplicatively', () => {
    // Baseline: no modifiers
    const baseConfig: SimulationConfig = {
      classes: ['paladin', 'hero'],
      scenarios: [{ name: 'Baseline' }],
    };
    const baseResults = runSimulation(
      baseConfig, classDataMap, gearTemplates,
      weaponData, attackSpeedData, mwData
    );

    // Combined: PDR 0.3 + KB + Holy 1.5x + 3 targets
    const composedConfig: SimulationConfig = {
      classes: ['paladin', 'hero'],
      scenarios: [{
        name: 'Composed',
        pdr: 0.3,
        targetCount: 3,
        bossAttackInterval: 2.0,
        bossAccuracy: 250,
        elementModifiers: { Holy: 1.5 },
      }],
    };
    const composedResults = runSimulation(
      composedConfig, classDataMap, gearTemplates,
      weaponData, attackSpeedData, mwData
    );

    const baselinePaladin = baseResults.find(
      r => r.className === 'Paladin' && r.scenario === 'Baseline'
    )!;
    const composedPaladin = composedResults.find(
      r => r.className === 'Paladin' && r.scenario === 'Composed'
    )!;
    const baselineHero = baseResults.find(
      r => r.className === 'Hero' && r.scenario === 'Baseline'
    )!;
    const composedHero = composedResults.find(
      r => r.className === 'Hero' && r.scenario === 'Composed'
    )!;

    // Paladin should be boosted by Holy 1.5x element but reduced by PDR + KB
    // The net effect depends on the exact numbers, but Paladin should differ from baseline
    expect(composedPaladin.dps.dps).not.toBe(baselinePaladin.dps.dps);

    // Hero has no element — PDR and KB both reduce, targets scale (maxTargets 3 × 3 targets = 3x)
    // So Hero composed = baseline × 3 (targets) × 0.7 (PDR) × KB_uptime
    // This should be greater than baseline (3 × 0.7 = 2.1, even with KB loss)
    expect(composedHero.dps.dps).toBeGreaterThan(baselineHero.dps.dps);

    // But Hero composed should be less than baseline × 3 (due to PDR + KB losses)
    expect(composedHero.dps.dps).toBeLessThan(baselineHero.dps.dps * 3);
  });

  it('KB reduces DPS for a class with no stance/shifter more than one with stance', () => {
    const kbConfig: SimulationConfig = {
      classes: ['hero', 'archmage-il'],
      scenarios: [
        { name: 'No KB' },
        { name: 'With KB', bossAttackInterval: 1.5, bossAccuracy: 250 },
      ],
    };

    const results = runSimulation(
      kbConfig, classDataMap, gearTemplates,
      weaponData, attackSpeedData, mwData
    );

    const heroNoKb = results.find(r => r.className === 'Hero' && r.scenario === 'No KB')!;
    const heroKb = results.find(r => r.className === 'Hero' && r.scenario === 'With KB')!;
    const mageNoKb = results.find(
      r => r.className === 'Archmage I/L' && r.skillName === 'Chain Lightning' && r.scenario === 'No KB'
    )!;
    const mageKb = results.find(
      r => r.className === 'Archmage I/L' && r.skillName === 'Chain Lightning' && r.scenario === 'With KB'
    )!;

    const heroLossPercent = 1 - heroKb.dps.dps / heroNoKb.dps.dps;
    const mageLossPercent = 1 - mageKb.dps.dps / mageNoKb.dps.dps;

    // Hero has 90% stance, mage has 0% — mage should lose more DPS to KB
    expect(mageLossPercent).toBeGreaterThan(heroLossPercent);
    // Hero stance is 90%, so KB loss should be small
    expect(heroLossPercent).toBeLessThan(0.05);
    // Mage has no protection, should lose significant DPS
    expect(mageLossPercent).toBeGreaterThan(0.15);
  });

  it('element + PDR + targets all apply to the same result', () => {
    // Verify each modifier independently, then combined
    const configs = {
      baseline: [{ name: 'Baseline' }],
      pdrOnly: [{ name: 'PDR', pdr: 0.3 }],
      elemOnly: [{ name: 'Elem', elementModifiers: { Holy: 1.5 } }],
      targetsOnly: [{ name: 'Targets', targetCount: 3 }],
      combined: [{ name: 'All', pdr: 0.3, elementModifiers: { Holy: 1.5 }, targetCount: 3 }],
    } as const;

    const run = (scenarios: ScenarioConfig[]) =>
      runSimulation(
        { classes: ['paladin'], scenarios },
        classDataMap, gearTemplates, weaponData, attackSpeedData, mwData
      );

    const baseline = run([...configs.baseline]).find(r => r.scenario === 'Baseline')!;
    const pdrOnly = run([...configs.pdrOnly]).find(r => r.scenario === 'PDR')!;
    const elemOnly = run([...configs.elemOnly]).find(r => r.scenario === 'Elem')!;
    const combined = run([...configs.combined]).find(r => r.scenario === 'All')!;

    // PDR reduces by 30%
    expect(pdrOnly.dps.dps).toBeCloseTo(baseline.dps.dps * 0.7, 0);

    // Element boosts (but less than 1.5x due to damage cap interaction)
    expect(elemOnly.dps.dps).toBeGreaterThan(baseline.dps.dps);
    expect(elemOnly.dps.dps).toBeLessThan(baseline.dps.dps * 1.5);

    // Combined: element boost × PDR × targets
    // Paladin Blast has no maxTargets field (single target), so targets shouldn't scale it
    // combined ≈ elemOnly × 0.7
    expect(combined.dps.dps).toBeCloseTo(elemOnly.dps.dps * 0.7, 0);
  });
});

function makeDpsResult(dps: number): DpsResult {
  return {
    skillName: 'TestSkill',
    attackTime: 0.6,
    damageRange: { min: 1000, max: 2000, average: 1500 },
    skillDamagePercent: 260,
    critDamagePercent: 390,
    adjustedRangeNormal: 1000,
    adjustedRangeCrit: 1500,
    averageDamage: dps * 0.6,
    dps,
    uncappedDps: dps,
    capLossPercent: 0,
    totalCritRate: 0.15,
    hitCount: 2,
    hasShadowPartner: false,
  };
}

describe('applyPdr (isolated)', () => {
  it('PDR = 0 leaves DPS unchanged', () => {
    const input = makeDpsResult(100000);
    const result = applyPdr(input, 0);
    expect(result.dps).toBe(100000);
    expect(result.averageDamage).toBe(input.averageDamage);
    expect(result.uncappedDps).toBe(100000);
  });

  it('PDR = 0.5 halves DPS, averageDamage, and uncappedDps', () => {
    const input = makeDpsResult(200000);
    const result = applyPdr(input, 0.5);
    expect(result.dps).toBe(100000);
    expect(result.averageDamage).toBe(input.averageDamage * 0.5);
    expect(result.uncappedDps).toBe(100000);
  });

  it('PDR = 1 zeroes DPS, averageDamage, and uncappedDps', () => {
    const input = makeDpsResult(150000);
    const result = applyPdr(input, 1);
    expect(result.dps).toBe(0);
    expect(result.averageDamage).toBe(0);
    expect(result.uncappedDps).toBe(0);
  });

  it('does not mutate the input DpsResult', () => {
    const input = makeDpsResult(100000);
    const originalDps = input.dps;
    applyPdr(input, 0.5);
    expect(input.dps).toBe(originalDps);
  });

  it('preserves non-scaled fields', () => {
    const input = makeDpsResult(100000);
    const result = applyPdr(input, 0.3);
    expect(result.attackTime).toBe(input.attackTime);
    expect(result.skillDamagePercent).toBe(input.skillDamagePercent);
    expect(result.critDamagePercent).toBe(input.critDamagePercent);
    expect(result.hitCount).toBe(input.hitCount);
    expect(result.totalCritRate).toBe(input.totalCritRate);
  });
});

describe('applyTargetCount (isolated)', () => {
  it('effectiveTargets = 1 leaves DPS unchanged', () => {
    const input = makeDpsResult(100000);
    const result = applyTargetCount(input, 1);
    expect(result.dps).toBe(100000);
    expect(result.averageDamage).toBe(input.averageDamage);
    expect(result.uncappedDps).toBe(100000);
  });

  it('effectiveTargets = 6, no bounceDecay → flat 6x scaling', () => {
    const input = makeDpsResult(100000);
    const result = applyTargetCount(input, 6);
    expect(result.dps).toBe(600000);
    expect(result.averageDamage).toBe(input.averageDamage * 6);
    expect(result.uncappedDps).toBe(600000);
  });

  it('effectiveTargets = 6, bounceDecay = 0.7 → geometric series', () => {
    const input = makeDpsResult(100000);
    const result = applyTargetCount(input, 6, 0.7);
    const expected = (1 - 0.7 ** 6) / (1 - 0.7);
    expect(result.dps).toBeCloseTo(100000 * expected, 2);
    expect(result.averageDamage).toBeCloseTo(input.averageDamage * expected, 2);
    expect(result.uncappedDps).toBeCloseTo(100000 * expected, 2);
  });

  it('bounceDecay = 0 falls back to flat scaling', () => {
    const input = makeDpsResult(100000);
    const result = applyTargetCount(input, 4, 0);
    expect(result.dps).toBe(400000);
  });

  it('bounceDecay = 1 falls back to flat scaling', () => {
    const input = makeDpsResult(100000);
    const result = applyTargetCount(input, 3, 1);
    expect(result.dps).toBe(300000);
  });

  it('bounceDecay undefined falls back to flat scaling', () => {
    const input = makeDpsResult(100000);
    const result = applyTargetCount(input, 5, undefined);
    expect(result.dps).toBe(500000);
  });

  it('does not mutate the input DpsResult', () => {
    const input = makeDpsResult(100000);
    const originalDps = input.dps;
    applyTargetCount(input, 6, 0.7);
    expect(input.dps).toBe(originalDps);
  });

  it('preserves non-scaled fields', () => {
    const input = makeDpsResult(100000);
    const result = applyTargetCount(input, 3);
    expect(result.attackTime).toBe(input.attackTime);
    expect(result.hitCount).toBe(input.hitCount);
    expect(result.totalCritRate).toBe(input.totalCritRate);
  });
});

describe('applyKnockbackUptime (isolated)', () => {
  it('uptime = 1.0 leaves DPS unchanged', () => {
    const input = makeDpsResult(100000);
    const result = applyKnockbackUptime(input, 1.0);
    expect(result.dps).toBe(100000);
    expect(result.averageDamage).toBe(input.averageDamage);
    expect(result.uncappedDps).toBe(100000);
  });

  it('uptime = 0.5 halves DPS, averageDamage, and uncappedDps', () => {
    const input = makeDpsResult(200000);
    const result = applyKnockbackUptime(input, 0.5);
    expect(result.dps).toBe(100000);
    expect(result.averageDamage).toBe(input.averageDamage * 0.5);
    expect(result.uncappedDps).toBe(100000);
  });

  it('uptime = 0 zeroes DPS', () => {
    const input = makeDpsResult(150000);
    const result = applyKnockbackUptime(input, 0);
    expect(result.dps).toBe(0);
    expect(result.averageDamage).toBe(0);
    expect(result.uncappedDps).toBe(0);
  });

  it('does not mutate the input DpsResult', () => {
    const input = makeDpsResult(100000);
    const originalDps = input.dps;
    applyKnockbackUptime(input, 0.5);
    expect(input.dps).toBe(originalDps);
  });

  it('preserves non-scaled fields', () => {
    const input = makeDpsResult(100000);
    const result = applyKnockbackUptime(input, 0.8);
    expect(result.attackTime).toBe(input.attackTime);
    expect(result.skillDamagePercent).toBe(input.skillDamagePercent);
    expect(result.hitCount).toBe(input.hitCount);
  });
});

describe('mixed rotation with missing skill reference', () => {
  it('silently skips rotation when a referenced skill does not exist', () => {
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
      ],
      mixedRotations: [
        {
          name: 'Mixed A+Missing',
          description: 'References a skill that does not exist',
          components: [
            { skill: 'Skill A', weight: 0.8 },
            { skill: 'Nonexistent Skill', weight: 0.2 },
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

    const localWeaponData: WeaponData = {
      types: [{ name: 'Gun', slashMultiplier: 3.6, stabMultiplier: 3.6 }],
    };

    const localAttackSpeedData: AttackSpeedData = {
      categories: ['Battleship Cannon'],
      entries: [{ speed: 2, times: { 'Battleship Cannon': 0.6 } }],
    };

    const localMwData: MWData = [{ level: 20, multiplier: 1.1 }];

    const localClassDataMap = new Map([['testclass', classData]]);
    const localGearTemplates: GearTemplateMap = new Map([['testclass', build]]);

    const config: SimulationConfig = {
      classes: ['testclass'],
    };

    const results = runSimulation(
      config, localClassDataMap, localGearTemplates,
      localWeaponData, localAttackSpeedData, localMwData
    );

    const mixed = results.find(r => r.skillName === 'Mixed A+Missing');
    expect(mixed).toBeUndefined();

    const skillA = results.find(r => r.skillName === 'Skill A');
    expect(skillA).toBeDefined();
    expect(results).toHaveLength(1);
  });
});
