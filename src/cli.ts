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
import type { ScenarioConfig } from './proposals/types.js';
import { validateProposal, ProposalValidationError } from './proposals/validate.js';
import { renderComparisonReport, renderBaselineReport } from './report/markdown.js';
import { renderAsciiChart } from './report/ascii-chart.js';
import { analyzeBalance } from './audit/analyze.js';
import { formatAuditReport } from './audit/format.js';
import { DEFAULT_SCENARIOS } from './scenarios.js';

function loadProposal(path: string) {
  const fullPath = resolve(path);
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(fullPath, 'utf-8'));
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`Failed to parse ${path}: ${msg}`);
  }
  return validateProposal(raw);
}

function main() {
  const auditFlag = process.argv.includes('--audit');
  const args = process.argv.slice(2).filter((arg: string) => !arg.startsWith('--'));
  const proposalPath = args[0];

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

    if (auditFlag) {
      const audit = analyzeBalance(results);
      console.log(formatAuditReport(audit));
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
