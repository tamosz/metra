import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  loadWeapons,
  loadAttackSpeed,
  loadMW,
  discoverClassesAndTiers,
} from './data/loader.js';
import type { ClassSkillData } from './data/types.js';
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

    // Hero Brandish (Sword) High matches hero charts scenario 3
    const heroDelta = result.deltas.find(
      (d) => d.className === 'Hero' && d.skillName === 'Brandish (Sword)' && d.tier === 'high'
    )!;
    expect(Math.abs(heroDelta.after - 264916.78889)).toBeLessThan(1);
    expect(heroDelta.changePercent).toBeCloseTo(7.1, 0);

    // DrK unchanged
    const drkDelta = result.deltas.find(
      (d) => d.className === 'DrK' && d.tier === 'high'
    )!;
    expect(drkDelta.change).toBe(0);

    // NL unchanged (not a warrior skill)
    const nlDelta = result.deltas.find(
      (d) => d.className === 'NL' && d.tier === 'high'
    )!;
    expect(nlDelta).toBeDefined();
    expect(nlDelta.change).toBe(0);

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

    // DrK goes down (Crusher nerfed 170→150)
    const drkDelta = result.deltas.find(
      (d) => d.className === 'DrK' && d.tier === 'high'
    )!;
    expect(drkDelta.change).toBeLessThan(0);

    // Paladin Blast (Holy) goes up (580→600)
    const paladinHolyDelta = result.deltas.find(
      (d) => d.className === 'Paladin' && d.skillName === 'Blast (Holy, Sword)' && d.tier === 'high'
    )!;
    expect(paladinHolyDelta.change).toBeGreaterThan(0);

    // Paladin Blast (F/I/L) is NOT changed
    const paladinFilDelta = result.deltas.find(
      (d) => d.className === 'Paladin' && d.skillName === 'Blast (F/I/L Charge, Sword)' && d.tier === 'high'
    )!;
    expect(paladinFilDelta.change).toBe(0);

    // NL unchanged (warrior-only proposal)
    const nlDelta = result.deltas.find(
      (d) => d.className === 'NL' && d.tier === 'high'
    )!;
    expect(nlDelta).toBeDefined();
    expect(nlDelta.change).toBe(0);
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

    // Rebalance report should show DrK change (nerf)
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
      'Hero', 'Hero (Axe)', 'DrK', 'Paladin', 'NL',
      'Bowmaster', 'Marksman', 'Corsair', 'Buccaneer', 'Shadower',
    ];
    for (const name of expectedClasses) {
      expect(baselineReport, `report should contain ${name}`).toContain(name);
    }
  });

  it('high-tier DPS matches reference values', () => {
    const find = (className: string, skillName: string) =>
      baselineResults.find(
        (r) => r.className === className && r.skillName === skillName && r.tier === 'high'
      )!;

    expect(find('Hero', 'Brandish (Sword)').dps.dps).toBeCloseTo(247314, -2);
    expect(find('Hero (Axe)', 'Brandish').dps.dps).toBeCloseTo(257772, -2);
    expect(find('DrK', 'Spear Crusher').dps.dps).toBeCloseTo(251906, -2);
    expect(find('Paladin', 'Blast (Holy, Sword)').dps.dps).toBeCloseTo(192932, -2);
    expect(find('NL', 'Triple Throw 30').dps.dps).toBeCloseTo(292314, -2);
    expect(find('Bowmaster', 'Hurricane').dps.dps).toBeCloseTo(233073, -2);
    expect(find('Bowmaster', 'Strafe').dps.dps).toBeCloseTo(206551, -2);
    expect(find('Marksman', 'Strafe (MM)').dps.dps).toBeCloseTo(232748, -2);
    expect(find('Marksman', 'Snipe + Strafe').dps.dps).toBeCloseTo(234586, -2);
    expect(find('Corsair', 'Battleship Cannon').dps.dps).toBeCloseTo(350586, -2);
    expect(find('Corsair', 'Rapid Fire').dps.dps).toBeCloseTo(241520, -2);
    expect(find('Buccaneer', 'Demolition').dps.dps).toBeCloseTo(247417, -2);
    expect(find('Buccaneer', 'Barrage + Demolition').dps.dps).toBeGreaterThan(find('Buccaneer', 'Demolition').dps.dps);
    expect(find('Shadower', 'BStep + Assassinate 30').dps.dps).toBeCloseTo(326734, -2);
    expect(find('Shadower', 'Savage Blow').dps.dps).toBeCloseTo(183467, -2);
  });

  it('mid-tier DPS matches reference values', () => {
    const find = (className: string, skillName: string) =>
      baselineResults.find(
        (r) => r.className === className && r.skillName === skillName && r.tier === 'mid'
      )!;

    expect(find('Hero', 'Brandish (Sword)').dps.dps).toBeCloseTo(167678, -2);
    expect(find('Hero (Axe)', 'Brandish').dps.dps).toBeCloseTo(174755, -2);
    expect(find('DrK', 'Spear Crusher').dps.dps).toBeCloseTo(172570, -2);
    expect(find('Paladin', 'Blast (Holy, Sword)').dps.dps).toBeCloseTo(130807, -2);
    expect(find('NL', 'Triple Throw 30').dps.dps).toBeCloseTo(194891, -2);
    expect(find('Bowmaster', 'Hurricane').dps.dps).toBeCloseTo(157112, -2);
    expect(find('Bowmaster', 'Strafe').dps.dps).toBeCloseTo(139234, -2);
    expect(find('Marksman', 'Strafe (MM)').dps.dps).toBeCloseTo(157515, -2);
    expect(find('Marksman', 'Snipe + Strafe').dps.dps).toBeCloseTo(171366, -2);
    expect(find('Corsair', 'Battleship Cannon').dps.dps).toBeCloseTo(239622, -2);
    expect(find('Corsair', 'Rapid Fire').dps.dps).toBeCloseTo(165076, -2);
    expect(find('Buccaneer', 'Demolition').dps.dps).toBeCloseTo(163986, -2);
    expect(find('Buccaneer', 'Barrage + Demolition').dps.dps).toBeGreaterThan(find('Buccaneer', 'Demolition').dps.dps);
    expect(find('Shadower', 'BStep + Assassinate 30').dps.dps).toBeCloseTo(239830, -2);
    expect(find('Shadower', 'Savage Blow').dps.dps).toBeCloseTo(134668, -2);
  });

  it('low-tier DPS matches reference values', () => {
    const find = (className: string, skillName: string) =>
      baselineResults.find(
        (r) => r.className === className && r.skillName === skillName && r.tier === 'low'
      )!;

    expect(find('Hero', 'Brandish (Sword)').dps.dps).toBeCloseTo(127356, -2);
    expect(find('DrK', 'Spear Crusher').dps.dps).toBeCloseTo(133009, -2);
    expect(find('Paladin', 'Blast (Holy, Sword)').dps.dps).toBeCloseTo(99352, -2);
    expect(find('Bowmaster', 'Hurricane').dps.dps).toBeCloseTo(104932, -2);
    expect(find('Marksman', 'Strafe (MM)').dps.dps).toBeCloseTo(105644, -2);
    expect(find('Marksman', 'Snipe + Strafe').dps.dps).toBeCloseTo(127777, -2);
    expect(find('Corsair', 'Battleship Cannon').dps.dps).toBeCloseTo(180049, -2);
    expect(find('Corsair', 'Rapid Fire').dps.dps).toBeCloseTo(124036, -2);
    expect(find('Buccaneer', 'Demolition').dps.dps).toBeCloseTo(121362, -2);
    expect(find('Buccaneer', 'Barrage + Demolition').dps.dps).toBeGreaterThan(find('Buccaneer', 'Demolition').dps.dps);
    expect(find('Shadower', 'BStep + Assassinate 30').dps.dps).toBeCloseTo(198577, -2);
    expect(find('Shadower', 'Savage Blow').dps.dps).toBeCloseTo(111504, -2);
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

  it('comboGroup aggregates Buccaneer to 2 results per tier', () => {
    const buccResults = buffedResults.filter((r) => r.className === 'Buccaneer');
    const buccHigh = buccResults.filter((r) => r.tier === 'high');
    const buccLow = buccResults.filter((r) => r.tier === 'low');
    expect(buccHigh).toHaveLength(2);
    expect(buccLow).toHaveLength(2);
    expect(buccHigh.map((r) => r.skillName).sort()).toEqual(
      ['Barrage + Demolition', 'Demolition']
    );
  });

  it('comboGroup aggregates Shadower to 2 results per tier', () => {
    const shadResults = buffedResults.filter((r) => r.className === 'Shadower');
    const shadHigh = shadResults.filter((r) => r.tier === 'high');
    const shadLow = shadResults.filter((r) => r.tier === 'low');
    expect(shadHigh).toHaveLength(2);
    expect(shadLow).toHaveLength(2);
    expect(shadHigh.map((r) => r.skillName).sort()).toEqual(
      ['BStep + Assassinate 30', 'Savage Blow']
    );
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
        name: 'Unbuffed',
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
    expect(report).toContain('## Unbuffed');
    expect(report).toContain('## Bossing (50% PDR)');

    // Snipe + Strafe combo DPS in buffed scenario
    const comboBuffed = results.find(
      (r) => r.className === 'Marksman' && r.skillName === 'Snipe + Strafe' && r.scenario === 'Buffed' && r.tier === 'high'
    )!;
    expect(comboBuffed.dps.dps).toBeCloseTo(234586, -2);

    // Combo DPS is halved with 50% PDR
    const comboPdr = results.find(
      (r) => r.className === 'Marksman' && r.skillName === 'Snipe + Strafe' && r.scenario === 'Bossing (50% PDR)' && r.tier === 'high'
    )!;
    expect(comboPdr.dps.dps).toBeCloseTo(117293, -2);
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
