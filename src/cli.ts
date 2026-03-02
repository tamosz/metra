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

export function parseKbFlags(): { bossAttackInterval: number; bossAccuracy: number } | undefined {
  if (!process.argv.includes('--kb')) return undefined;
  const intervalIdx = process.argv.indexOf('--kb-interval');
  const accuracyIdx = process.argv.indexOf('--kb-accuracy');
  const interval = intervalIdx !== -1 ? Number(process.argv[intervalIdx + 1]) : 1.5;
  const accuracy = accuracyIdx !== -1 ? Number(process.argv[accuracyIdx + 1]) : 250;
  if (!Number.isFinite(interval) || interval <= 0) {
    throw new Error('--kb-interval requires a positive number (e.g., --kb-interval 1.5)');
  }
  if (!Number.isFinite(accuracy) || accuracy < 1) {
    throw new Error('--kb-accuracy requires a positive integer (e.g., --kb-accuracy 250)');
  }
  return { bossAttackInterval: interval, bossAccuracy: accuracy };
}

function main() {
  const auditFlag = process.argv.includes('--audit');
  const targetCount = parseTargetsFlag();
  const kbConfig = parseKbFlags();

  // Filter out flags and their values to get positional args (proposal paths)
  const skipValues = new Set<string>();
  const flagsWithValues = ['--targets', '--kb-interval', '--kb-accuracy'];
  for (const flag of flagsWithValues) {
    const idx = process.argv.indexOf(flag);
    if (idx !== -1 && process.argv[idx + 1]) {
      skipValues.add(process.argv[idx + 1]);
    }
  }
  const positionalArgs = process.argv
    .slice(2)
    .filter((arg: string) => !arg.startsWith('--'))
    .filter((arg: string) => !skipValues.has(arg));
  const proposalPath = positionalArgs[0];

  // Load game data
  const weaponData = loadWeapons();
  const attackSpeedData = loadAttackSpeed();
  const mwData = loadMW();
  const { classNames, tiers, classDataMap, gearTemplates } = discoverClassesAndTiers();

  const baseline: ScenarioConfig = { name: kbConfig ? 'Baseline (KB, experimental)' : 'Baseline' };
  if (kbConfig) {
    baseline.bossAttackInterval = kbConfig.bossAttackInterval;
    baseline.bossAccuracy = kbConfig.bossAccuracy;
  }
  const scenarios: ScenarioConfig[] = [baseline];
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

    // ASCII chart for the first scenario
    const firstScenario = results[0]?.scenario;
    const firstScenarioResults = results.filter((r) => r.scenario === firstScenario);
    if (firstScenarioResults.length > 0) {
      console.log(renderAsciiChart(
        firstScenarioResults.map((r) => ({
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
