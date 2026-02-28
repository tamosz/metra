import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  loadWeapons,
  loadAttackSpeed,
  loadMapleWarrior,
  loadClassSkills,
  loadGearTemplate,
} from './data/loader.js';
import type { ClassSkillData } from './data/types.js';
import { compareProposal } from './proposals/compare.js';
import type { SimulationConfig, GearTemplateMap } from './proposals/simulate.js';
import type { Proposal } from './proposals/types.js';
import { renderComparisonReport } from './report/markdown.js';
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
let mapleWarriorData: ReturnType<typeof loadMapleWarrior>;

beforeAll(() => {
  weaponData = loadWeapons();
  attackSpeedData = loadAttackSpeed();
  mapleWarriorData = loadMapleWarrior();

  const classNames = ['hero', 'drk', 'paladin'];
  classDataMap = new Map<string, ClassSkillData>();
  for (const name of classNames) {
    classDataMap.set(name, loadClassSkills(name));
  }

  gearTemplates = new Map();
  for (const name of classNames) {
    for (const tier of ['low', 'high']) {
      gearTemplates.set(`${name}-${tier}`, loadGearTemplate(`${name}-${tier}`));
    }
  }

  config = { classes: classNames, tiers: ['low', 'high'] };
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
      mapleWarriorData
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
    expect(Math.abs(heroDelta.after - 274167.04444)).toBeLessThan(1);
    expect(heroDelta.changePercent).toBeCloseTo(7.1, 0);

    // DrK unchanged
    const drkDelta = result.deltas.find(
      (d) => d.className === 'DrK' && d.tier === 'high'
    )!;
    expect(drkDelta.change).toBe(0);
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
      mapleWarriorData
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
  });

  it('produces distinct Markdown reports for different proposals', () => {
    const brandish = loadProposal('brandish-buff-20.json');
    const rebalance = loadProposal('warrior-rebalance.json');

    const report1 = renderComparisonReport(
      compareProposal(brandish, config, classDataMap, gearTemplates, weaponData, attackSpeedData, mapleWarriorData)
    );
    const report2 = renderComparisonReport(
      compareProposal(rebalance, config, classDataMap, gearTemplates, weaponData, attackSpeedData, mapleWarriorData)
    );

    // Reports should be different
    expect(report1).not.toBe(report2);
    expect(report1).toContain('Brandish +20 Base Power');
    expect(report2).toContain('Warrior Rebalance');

    // Rebalance report should show DrK change (nerf)
    expect(report2).toMatch(/-\d/); // negative change value
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
