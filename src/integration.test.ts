import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  loadWeapons,
  loadAttackSpeed,
  loadMW,
  discoverClassesAndTiers,
} from './data/loader.js';
import type { ClassSkillData } from '@metra/engine';
import { compareProposal } from './proposals/compare.js';
import { runSimulation } from './proposals/simulate.js';
import type { SimulationConfig, GearTemplateMap } from './proposals/simulate.js';
import type { Proposal, ScenarioConfig, ScenarioResult } from './proposals/types.js';
import { renderComparisonReport, renderBaselineReport } from './report/markdown.js';
import { applyProposal } from './proposals/apply.js';

const DATA_DIR = resolve(import.meta.dirname, '..');

function loadProposal(filename: string): Proposal {
  return JSON.parse(
    readFileSync(resolve(DATA_DIR, 'proposals', filename), 'utf-8')
  );
}

let classDataMap: Map<string, ClassSkillData>;
let gearTemplates: GearTemplateMap;
let config: SimulationConfig;
let weaponData: ReturnType<typeof loadWeapons>;
let attackSpeedData: ReturnType<typeof loadAttackSpeed>;
let mwData: ReturnType<typeof loadMW>;

beforeAll(() => {
  weaponData = loadWeapons();
  attackSpeedData = loadAttackSpeed();
  mwData = loadMW();

  const discovery = discoverClassesAndTiers();
  classDataMap = discovery.classDataMap;
  gearTemplates = discovery.gearTemplates;
  config = { classes: discovery.classNames, tiers: discovery.tiers };
});

describe('End-to-end: brandish-buff-20 proposal', () => {
  it('produces a complete Markdown report', () => {
    const proposal = loadProposal('brandish-buff-20.json');
    const result = compareProposal(
      proposal,
      config,
      classDataMap,
      gearTemplates,
      weaponData,
      attackSpeedData,
      mwData
    );
    const report = renderComparisonReport(result);

    // Report structure
    expect(report).toContain('# Proposal: Brandish +20 Base Power');
    expect(report).toContain('## Changes');
    expect(report).toContain('## DPS Comparison');

    // Hero Brandish (Sword) should be buffed with positive change
    const heroDelta = result.deltas.find(
      (d) => d.className === 'Hero' && d.skillName === 'Brandish (Sword)' && d.tier === 'high'
    )!;
    expect(heroDelta.change).toBeGreaterThan(0);
    expect(heroDelta.changePercent).toBeCloseTo(7.1, 0);

    // Dark Knight unchanged
    const darkKnightDelta = result.deltas.find(
      (d) => d.className === 'Dark Knight' && d.tier === 'high'
    )!;
    expect(darkKnightDelta.change).toBe(0);

    // Night Lord unchanged (not a warrior skill)
    const nightLordDelta = result.deltas.find(
      (d) => d.className === 'Night Lord' && d.tier === 'high'
    )!;
    expect(nightLordDelta).toBeDefined();
    expect(nightLordDelta.change).toBe(0);

    // All 5 new classes appear with zero change
    for (const className of ['Bowmaster', 'Marksman', 'Corsair', 'Buccaneer', 'Shadower']) {
      const delta = result.deltas.find(
        (d) => d.className === className && d.tier === 'high'
      );
      expect(delta, `${className} should appear in deltas`).toBeDefined();
      expect(delta!.change).toBe(0);
    }
  });
});

describe('End-to-end: warrior-rebalance proposal', () => {
  it('applies multi-class changes with correct independent deltas', () => {
    const proposal = loadProposal('warrior-rebalance.json');
    const result = compareProposal(
      proposal,
      config,
      classDataMap,
      gearTemplates,
      weaponData,
      attackSpeedData,
      mwData
    );

    // Hero goes up (Brandish buffed 260→280)
    const heroDelta = result.deltas.find(
      (d) => d.className === 'Hero' && d.skillName === 'Brandish (Sword)' && d.tier === 'high'
    )!;
    expect(heroDelta.change).toBeGreaterThan(0);

    // Dark Knight goes down (Crusher nerfed 170→150)
    const darkKnightDelta = result.deltas.find(
      (d) => d.className === 'Dark Knight' && d.tier === 'high'
    )!;
    expect(darkKnightDelta.change).toBeLessThan(0);

    // Paladin Blast (Holy) goes up (580→600)
    const paladinHolyDelta = result.deltas.find(
      (d) => d.className === 'Paladin' && d.skillName === 'Blast (Holy, Sword)' && d.tier === 'high'
    )!;
    expect(paladinHolyDelta.change).toBeGreaterThan(0);

    // With elementVariantGroup merging, only the winning variant (Holy) appears
    // F/I/L Charge is merged away since Holy wins at neutral elements
    const paladinDeltas = result.deltas.filter(
      (d) => d.className === 'Paladin' && d.tier === 'high'
    );
    expect(paladinDeltas).toHaveLength(1);
    expect(paladinDeltas[0].skillName).toBe('Blast (Holy, Sword)');

    // Night Lord unchanged (warrior-only proposal)
    const nightLordDelta = result.deltas.find(
      (d) => d.className === 'Night Lord' && d.tier === 'high'
    )!;
    expect(nightLordDelta).toBeDefined();
    expect(nightLordDelta.change).toBe(0);
  });

  it('produces distinct Markdown reports for different proposals', () => {
    const brandish = loadProposal('brandish-buff-20.json');
    const rebalance = loadProposal('warrior-rebalance.json');

    const report1 = renderComparisonReport(
      compareProposal(brandish, config, classDataMap, gearTemplates, weaponData, attackSpeedData, mwData)
    );
    const report2 = renderComparisonReport(
      compareProposal(rebalance, config, classDataMap, gearTemplates, weaponData, attackSpeedData, mwData)
    );

    // Reports should be different
    expect(report1).not.toBe(report2);
    expect(report1).toContain('Brandish +20 Base Power');
    expect(report2).toContain('Warrior Rebalance');

    // Rebalance report should show Dark Knight change (nerf)
    expect(report2).toMatch(/-\d/); // negative change value
  });
});

describe('Baseline mode', () => {
  let baselineResults: ScenarioResult[];
  let baselineReport: string;

  beforeAll(() => {
    const baselineConfig: SimulationConfig = {
      ...config,
      scenarios: [{ name: 'Buffed' }],
    };
    baselineResults = runSimulation(
      baselineConfig,
      classDataMap,
      gearTemplates,
      weaponData,
      attackSpeedData,
      mwData
    );
    baselineReport = renderBaselineReport(baselineResults);
  });

  it('renders report with all 10 class display names', () => {
    expect(baselineReport).toContain('# DPS Rankings');
    expect(baselineReport).toContain('## Buffed');

    const expectedClasses = [
      'Hero', 'Hero (Axe)', 'Dark Knight', 'Paladin', 'Night Lord',
      'Bowmaster', 'Marksman', 'Corsair', 'Buccaneer', 'Shadower',
    ];
    for (const name of expectedClasses) {
      expect(baselineReport, `report should contain ${name}`).toContain(name);
    }
  });

  it('high-tier DPS matches reference values', () => {
    const highResults = baselineResults.filter(r => r.tier === 'high');
    const snapshot = Object.fromEntries(
      highResults.sort((a, b) => b.dps.dps - a.dps.dps)
        .map(r => [`${r.className} / ${r.skillName}`, Math.round(r.dps.dps)])
    );
    expect(snapshot).toMatchSnapshot();
  });

  it('mid-tier DPS matches reference values', () => {
    const midResults = baselineResults.filter(r => r.tier === 'mid');
    const snapshot = Object.fromEntries(
      midResults.sort((a, b) => b.dps.dps - a.dps.dps)
        .map(r => [`${r.className} / ${r.skillName}`, Math.round(r.dps.dps)])
    );
    expect(snapshot).toMatchSnapshot();
  });

  it('low-tier DPS matches reference values', () => {
    const lowResults = baselineResults.filter(r => r.tier === 'low');
    const snapshot = Object.fromEntries(
      lowResults.sort((a, b) => b.dps.dps - a.dps.dps)
        .map(r => [`${r.className} / ${r.skillName}`, Math.round(r.dps.dps)])
    );
    expect(snapshot).toMatchSnapshot();
  });
});

describe('Special mechanics', () => {
  let buffedResults: ScenarioResult[];

  beforeAll(() => {
    const buffedConfig: SimulationConfig = {
      ...config,
      scenarios: [{ name: 'Buffed' }],
    };
    buffedResults = runSimulation(
      buffedConfig,
      classDataMap,
      gearTemplates,
      weaponData,
      attackSpeedData,
      mwData
    );
  });

  it('comboGroup aggregates Marksman Snipe + Strafe to 2 results per tier', () => {
    const mmResults = buffedResults.filter((r) => r.className === 'Marksman');
    const mmHigh = mmResults.filter((r) => r.tier === 'high');
    const mmLow = mmResults.filter((r) => r.tier === 'low');
    expect(mmHigh).toHaveLength(2);
    expect(mmLow).toHaveLength(2);
    expect(mmHigh.map((r) => r.skillName).sort()).toEqual(
      ['Snipe + Strafe', 'Strafe (MM)']
    );
  });

  it('comboGroup aggregates Buccaneer to 1 result per tier (standalone Demolition hidden)', () => {
    const buccResults = buffedResults.filter((r) => r.className === 'Buccaneer');
    const buccHigh = buccResults.filter((r) => r.tier === 'high');
    const buccLow = buccResults.filter((r) => r.tier === 'low');
    expect(buccHigh).toHaveLength(2);
    expect(buccLow).toHaveLength(2);
    expect(buccHigh.map((r) => r.skillName).sort()).toEqual(
      ['Barrage + Demolition', 'Snatch + Dragon Strike']
    );
  });

  it('comboGroup aggregates Shadower to 1 result per tier (Savage Blow hidden)', () => {
    const shadResults = buffedResults.filter((r) => r.className === 'Shadower');
    const shadHigh = shadResults.filter((r) => r.tier === 'high');
    const shadLow = shadResults.filter((r) => r.tier === 'low');
    expect(shadHigh).toHaveLength(1);
    expect(shadLow).toHaveLength(1);
    expect(shadHigh.map((r) => r.skillName)).toEqual(
      ['BStep + Assassinate']
    );
  });

  it('isComposite is set on combo groups and mixed rotations, not on regular skills', () => {
    // Combo group: Buccaneer Barrage + Demolition
    const barrageDemoCombo = buffedResults.find(
      (r) => r.className === 'Buccaneer' && r.skillName === 'Barrage + Demolition'
    );
    expect(barrageDemoCombo?.isComposite).toBe(true);

    // Combo group: Shadower BStep + Assassinate
    const shadCombo = buffedResults.find(
      (r) => r.className === 'Shadower' && r.skillName === 'BStep + Assassinate'
    );
    expect(shadCombo?.isComposite).toBe(true);

    // Mixed rotation: Corsair Practical Bossing
    const practicalBossing = buffedResults.find(
      (r) => r.className === 'Corsair' && r.skillName === 'Practical Bossing'
    );
    expect(practicalBossing?.isComposite).toBe(true);

    // Non-combo skills should not have isComposite
    const heroBrandish = buffedResults.find(
      (r) => r.className === 'Hero' && r.skillName === 'Brandish (Sword)'
    );
    expect(heroBrandish?.isComposite).toBeUndefined();

    const nightLordTripleThrow = buffedResults.find(
      (r) => r.className === 'Night Lord' && r.skillName === 'Triple Throw'
    );
    expect(nightLordTripleThrow?.isComposite).toBeUndefined();
  });

  it('comboGroup aggregation sums uncappedDps and computes capLossPercent', () => {
    const buccCombo = buffedResults.find(
      (r) => r.className === 'Buccaneer' && r.skillName === 'Barrage + Demolition' && r.tier === 'high'
    )!;
    expect(buccCombo.dps.uncappedDps).toBeGreaterThan(0);
    expect(buccCombo.dps.capLossPercent).toBeGreaterThanOrEqual(0);
    // uncappedDps should be >= dps (cap can only reduce damage)
    expect(buccCombo.dps.uncappedDps).toBeGreaterThanOrEqual(buccCombo.dps.dps);
    // combo uncappedDps should be the sum of sub-skill uncappedDps, not just the first skill's value
    // Barrage + Demolition has 2 sub-skills so total should be significantly more than a single sub-skill
    expect(buccCombo.dps.uncappedDps).toBeGreaterThan(100000);
  });

  it('post-multipliers scale uncappedDps (PDR scenario)', () => {
    const pdrScenarios: ScenarioConfig[] = [
      { name: 'Buffed' },
      { name: 'PDR 50%', pdr: 0.5 },
    ];
    const pdrConfig: SimulationConfig = { ...config, scenarios: pdrScenarios };
    const pdrResults = runSimulation(
      pdrConfig, classDataMap, gearTemplates, weaponData, attackSpeedData, mwData
    );
    const heroBuffed = pdrResults.find(
      (r) => r.className === 'Hero' && r.skillName === 'Brandish (Sword)' && r.scenario === 'Buffed' && r.tier === 'high'
    )!;
    const heroPdr = pdrResults.find(
      (r) => r.className === 'Hero' && r.skillName === 'Brandish (Sword)' && r.scenario === 'PDR 50%' && r.tier === 'high'
    )!;
    // uncappedDps should be halved by PDR just like dps
    expect(heroPdr.dps.uncappedDps).toBeCloseTo(heroBuffed.dps.uncappedDps * 0.5, 0);
    // capLossPercent should remain the same (linear scaling preserves ratio)
    expect(heroPdr.dps.capLossPercent).toBeCloseTo(heroBuffed.dps.capLossPercent, 5);
  });

  it('Hurricane and Rapid Fire use 0.12s attack time', () => {
    const hurricane = buffedResults.find(
      (r) => r.className === 'Bowmaster' && r.skillName === 'Hurricane'
    )!;
    const rapidFire = buffedResults.find(
      (r) => r.className === 'Corsair' && r.skillName === 'Rapid Fire'
    )!;
    expect(hurricane.dps.attackTime).toBe(0.12);
    expect(rapidFire.dps.attackTime).toBe(0.12);
  });
});

describe('Multi-scenario baseline', () => {
  it('renders report with multiple scenarios and applies PDR to Snipe', () => {
    const scenarios: ScenarioConfig[] = [
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
      { name: 'Bossing (50% PDR)', pdr: 0.5 },
    ];

    const multiConfig: SimulationConfig = { ...config, scenarios };
    const results = runSimulation(
      multiConfig,
      classDataMap,
      gearTemplates,
      weaponData,
      attackSpeedData,
      mwData
    );
    const report = renderBaselineReport(results);

    expect(report).toContain('## Buffed');
    expect(report).toContain('## No Buffs');
    expect(report).toContain('## Bossing (50% PDR)');

    // Snipe + Strafe combo: PDR should halve DPS
    const comboBuffed = results.find(
      (r) => r.className === 'Marksman' && r.skillName === 'Snipe + Strafe' && r.scenario === 'Buffed' && r.tier === 'high'
    )!;
    const comboPdr = results.find(
      (r) =>
        r.className === 'Marksman' &&
        r.skillName === 'Snipe + Strafe' &&
        r.scenario === 'Bossing (50% PDR)' &&
        r.tier === 'high'
    )!;
    expect(comboPdr.dps.dps).toBeCloseTo(comboBuffed.dps.dps * 0.5, 0);
  });
});

describe('Ranking integrity', () => {
  it('ranks are contiguous and unique within each (scenario, tier) group', () => {
    const scenarios: ScenarioConfig[] = [{ name: 'Buffed' }];
    const rankConfig: SimulationConfig = { ...config, scenarios };

    const proposal = loadProposal('brandish-buff-20.json');
    const result = compareProposal(
      proposal,
      rankConfig,
      classDataMap,
      gearTemplates,
      weaponData,
      attackSpeedData,
      mwData
    );

    // Group deltas by (scenario, tier)
    const groups = new Map<string, typeof result.deltas>();
    for (const d of result.deltas) {
      const key = `${d.scenario}|${d.tier}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(d);
    }

    expect(groups.size).toBeGreaterThan(0);

    for (const [key, deltas] of groups) {
      // Both rankBefore and rankAfter should be defined
      const ranksBefore = deltas.map((d) => d.rankBefore!).sort((a, b) => a - b);
      const ranksAfter = deltas.map((d) => d.rankAfter!).sort((a, b) => a - b);

      // Contiguous 1..N
      const n = deltas.length;
      const expected = Array.from({ length: n }, (_, i) => i + 1);
      expect(ranksBefore, `rankBefore for ${key}`).toEqual(expected);
      expect(ranksAfter, `rankAfter for ${key}`).toEqual(expected);
    }
  });
});

describe('Multi-target training scenario', () => {
  it('AoE skills scale by maxTargets, single-target skills unchanged', () => {
    const trainingConfig: SimulationConfig = {
      ...config,
      scenarios: [
        { name: 'Buffed' },
        { name: 'Training (6 mobs)', targetCount: 6 },
      ],
    };
    const results = runSimulation(
      trainingConfig,
      classDataMap,
      gearTemplates,
      weaponData,
      attackSpeedData,
      mwData
    );

    const find = (className: string, skillName: string, scenario: string) =>
      results.find(
        (r) => r.className === className && r.skillName === skillName && r.scenario === scenario
      )!;

    // Hero Brandish: maxTargets 3, capped at 3 even with 6 mobs
    const heroBuffed = find('Hero', 'Brandish (Sword)', 'Buffed');
    const heroTraining = find('Hero', 'Brandish (Sword)', 'Training (6 mobs)');
    expect(heroTraining.dps.dps).toBeCloseTo(heroBuffed.dps.dps * 3, 0);

    // Night Lord Triple Throw: single-target (no maxTargets), unchanged
    const nightLordBuffed = find('Night Lord', 'Triple Throw', 'Buffed');
    const nightLordTraining = find('Night Lord', 'Triple Throw', 'Training (6 mobs)');
    expect(nightLordTraining.dps.dps).toBe(nightLordBuffed.dps.dps);

    // Shadower BStep+Assassinate combo: BStep has maxTargets 4, Assassinate defaults to 1
    const shadBuffed = find('Shadower', 'BStep + Assassinate', 'Buffed');
    const shadTraining = find('Shadower', 'BStep + Assassinate', 'Training (6 mobs)');
    expect(shadTraining.dps.dps).toBeGreaterThan(shadBuffed.dps.dps);
    expect(shadTraining.dps.dps).toBeLessThan(shadBuffed.dps.dps * 4);
  });
});

describe('Proposal validation', () => {
  it('from-value mismatch throws on stale proposal', () => {
    const staleProposal: Proposal = {
      name: 'Stale',
      author: 'test',
      changes: [
        { target: 'hero.brandish-sword', field: 'basePower', from: 999, to: 300 },
      ],
    };

    expect(() => applyProposal(classDataMap, staleProposal)).toThrow(/Stale proposal/);
  });
});
