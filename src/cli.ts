import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  loadWeapons,
  loadAttackSpeed,
  loadMW,
  discoverClassesAndTiers,
} from './data/loader.js';
import { compareProposal } from './proposals/compare.js';
import { runSimulation } from './proposals/simulate.js';
import type { SimulationConfig } from './proposals/simulate.js';
import type { ScenarioConfig } from './proposals/types.js';
import { validateProposal, ProposalValidationError } from './proposals/validate.js';
import { renderComparisonReport, renderBaselineReport } from './report/markdown.js';
import { renderAsciiChart } from './report/ascii-chart.js';
import { capitalize } from './report/utils.js';
import { analyzeBalance } from './audit/analyze.js';
import { formatAuditReport } from './audit/format.js';
import { DEFAULT_SCENARIOS } from './scenarios.js';

export function loadProposal(path: string) {
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

export function parseTargetsFlag(): number | undefined {
  const idx = process.argv.indexOf('--targets');
  if (idx === -1) return undefined;
  const val = Number(process.argv[idx + 1]);
  if (!Number.isFinite(val) || val < 1) {
    throw new Error('--targets requires a positive integer (e.g., --targets 6)');
  }
  return Math.floor(val);
}

function main() {
  const auditFlag = process.argv.includes('--audit');
  const targetCount = parseTargetsFlag();
  const args = process.argv.slice(2).filter((arg: string) => !arg.startsWith('--'));
  // Also filter out the value after --targets
  const targetsIdx = process.argv.indexOf('--targets');
  const skipValue = targetsIdx !== -1 ? process.argv[targetsIdx + 1] : undefined;
  const positionalArgs = args.filter((a) => a !== skipValue);
  const proposalPath = positionalArgs[0];

  // Load game data
  const weaponData = loadWeapons();
  const attackSpeedData = loadAttackSpeed();
  const mwData = loadMW();
  const { classNames, tiers, classDataMap, gearTemplates } = discoverClassesAndTiers();

  const scenarios: ScenarioConfig[] = [...DEFAULT_SCENARIOS];
  if (targetCount != null && targetCount > 1) {
    scenarios.push({
      name: `Training (${targetCount} mobs)`,
      targetCount,
    });
  }

  const config: SimulationConfig = {
    classes: classNames,
    tiers,
    scenarios,
  };

  if (!proposalPath) {
    // Baseline mode: show DPS rankings for all classes
    const results = runSimulation(
      config,
      classDataMap,
      gearTemplates,
      weaponData,
      attackSpeedData,
      mwData
    );

    const report = renderBaselineReport(results);
    console.log(report);

    // ASCII chart for the first scenario (Buffed)
    const buffedResults = results.filter((r) => r.scenario === 'Buffed');
    if (buffedResults.length > 0) {
      console.log(renderAsciiChart(
        buffedResults.map((r) => ({
          label: `${r.className} ${r.skillName} (${capitalize(r.tier)})`,
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
    mwData
  );

  const report = renderComparisonReport(result);
  console.log(report);
}

main();
