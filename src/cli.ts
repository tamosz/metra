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

function loadProposal(path: string): Proposal {
  const fullPath = resolve(path);
  return JSON.parse(readFileSync(fullPath, 'utf-8')) as Proposal;
}

function main() {
  const proposalPath = process.argv[2];
  if (!proposalPath) {
    console.error('Usage: npx tsx src/cli.ts <proposal.json>');
    console.error('Example: npx tsx src/cli.ts proposals/brandish-buff-20.json');
    process.exit(1);
  }

  // Load proposal
  const proposal = loadProposal(proposalPath);

  // Load game data
  const weaponData = loadWeapons();
  const attackSpeedData = loadAttackSpeed();
  const mapleWarriorData = loadMapleWarrior();

  const classNames = ['hero', 'drk', 'paladin'];
  const classDataMap = new Map<string, ClassSkillData>();
  for (const name of classNames) {
    classDataMap.set(name, loadClassSkills(name));
  }

  const tiers = ['low', 'high'];
  const gearTemplates: GearTemplateMap = new Map();
  for (const name of classNames) {
    for (const tier of tiers) {
      gearTemplates.set(`${name}-${tier}`, loadGearTemplate(`${name}-${tier}`));
    }
  }

  const config: SimulationConfig = { classes: classNames, tiers };

  // Run comparison
  const result = compareProposal(
    proposal,
    config,
    classDataMap,
    gearTemplates,
    weaponData,
    attackSpeedData,
    mapleWarriorData
  );

  // Render and print
  const report = renderComparisonReport(result);
  console.log(report);
}

main();
