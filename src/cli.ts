import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  loadWeapons,
  loadAttackSpeed,
  loadMapleWarrior,
  discoverClassesAndTiers,
} from './data/loader.js';
import { compareProposal } from './proposals/compare.js';
import { runSimulation } from './proposals/simulate.js';
import type { SimulationConfig } from './proposals/simulate.js';
import type { Proposal, ScenarioConfig } from './proposals/types.js';
import { renderComparisonReport, renderBaselineReport } from './report/markdown.js';
import { renderAsciiChart } from './report/ascii-chart.js';

function loadProposal(path: string): Proposal {
  const fullPath = resolve(path);
  return JSON.parse(readFileSync(fullPath, 'utf-8')) as Proposal;
}

const DEFAULT_SCENARIOS: ScenarioConfig[] = [
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
  {
    name: 'No-Echo',
    overrides: { echoActive: false },
  },
  {
    name: 'Bossing (50% PDR)',
    pdr: 0.5,
  },
];

function main() {
  const proposalPath = process.argv[2];

  // Load game data
  const weaponData = loadWeapons();
  const attackSpeedData = loadAttackSpeed();
  const mapleWarriorData = loadMapleWarrior();
  const { classNames, tiers, classDataMap, gearTemplates } = discoverClassesAndTiers();

  const config: SimulationConfig = {
    classes: classNames,
    tiers,
    scenarios: DEFAULT_SCENARIOS,
  };

  if (!proposalPath) {
    // Baseline mode: show DPS rankings for all classes
    const results = runSimulation(
      config,
      classDataMap,
      gearTemplates,
      weaponData,
      attackSpeedData,
      mapleWarriorData
    );

    const report = renderBaselineReport(results);
    console.log(report);

    // ASCII chart for the first scenario (Buffed)
    const buffedResults = results.filter((r) => r.scenario === 'Buffed');
    if (buffedResults.length > 0) {
      console.log(renderAsciiChart(
        buffedResults.map((r) => ({
          label: `${r.className} ${r.skillName} (${r.tier.charAt(0).toUpperCase() + r.tier.slice(1)})`,
          value: r.dps.dps,
        }))
      ));
    }
    return;
  }

  // Proposal mode: compare before/after
  const proposal = loadProposal(proposalPath);

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
  console.log(report);
}

main();
