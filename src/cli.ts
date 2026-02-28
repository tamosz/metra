import { readFileSync, readdirSync } from 'fs';
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

  // Auto-discover classes from data files
  const skillFiles = readdirSync(resolve('data/skills'))
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace('.json', ''));
  const templateFiles = readdirSync(resolve('data/gear-templates'))
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace('.json', ''));

  const classNames: string[] = [];
  const tiers = new Set<string>();
  for (const name of skillFiles) {
    const classTiers = templateFiles
      .filter((t) => t.startsWith(name + '-'))
      .map((t) => t.slice(name.length + 1));
    if (classTiers.length > 0) {
      classNames.push(name);
      for (const tier of classTiers) tiers.add(tier);
    }
  }

  const classDataMap = new Map<string, ClassSkillData>();
  for (const name of classNames) {
    classDataMap.set(name, loadClassSkills(name));
  }

  const tierArray = [...tiers];
  const gearTemplates: GearTemplateMap = new Map();
  for (const name of classNames) {
    for (const tier of tierArray) {
      const key = `${name}-${tier}`;
      if (templateFiles.includes(key)) {
        gearTemplates.set(key, loadGearTemplate(key));
      }
    }
  }

  const config: SimulationConfig = { classes: classNames, tiers: tierArray };

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
