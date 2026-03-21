import type {
  ClassSkillData,
  WeaponData,
  AttackSpeedData,
  MWData,
} from '@metra/engine';
import { applyProposal } from './apply.js';
import { runSimulation, type SimulationConfig, type GearTemplateMap } from './simulate.js';
import type { Proposal, ComparisonResult, DeltaEntry, ScenarioResult } from './types.js';

/**
 * Compare before/after DPS for a proposal across all configured scenarios.
 */
export function compareProposal(
  proposal: Proposal,
  config: SimulationConfig,
  classDataMap: Map<string, ClassSkillData>,
  gearTemplates: GearTemplateMap,
  weaponData: WeaponData,
  attackSpeedData: AttackSpeedData,
  mwData: MWData
): ComparisonResult {
  // Run "before" simulation
  const before = runSimulation(
    config,
    classDataMap,
    gearTemplates,
    weaponData,
    attackSpeedData,
    mwData
  );

  // Apply proposal and run "after" simulation
  const modifiedClassData = applyProposal(classDataMap, proposal);
  const after = runSimulation(
    config,
    modifiedClassData,
    gearTemplates,
    weaponData,
    attackSpeedData,
    mwData
  );

  // Compute deltas
  const deltas = computeDeltas(before, after);

  return { proposal, before, after, deltas };
}

/** Null-byte separated composite key — uniquely identifies a result across scenario/class/skill.
 *  Uses comparisonKey (from elementVariantGroup) when available so the key stays stable
 *  even when a different variant wins before vs after a proposal. */
function scenarioKey(r: ScenarioResult): string {
  const effectiveSkillName = r.comparisonKey ?? r.skillName;
  return `${r.scenario}\0${r.className}\0${effectiveSkillName}`;
}

export function computeDeltas(
  before: ScenarioResult[],
  after: ScenarioResult[]
): DeltaEntry[] {
  const afterMap = new Map<string, ScenarioResult>();
  for (const r of after) {
    afterMap.set(scenarioKey(r), r);
  }

  const beforeMap = new Map<string, ScenarioResult>();
  for (const r of before) {
    beforeMap.set(scenarioKey(r), r);
  }

  // Compute ranks per (scenario, tier) group
  const beforeRanks = computeRanks(before);
  const afterRanks = computeRanks(after);

  const deltas: DeltaEntry[] = [];

  for (const b of before) {
    const key = scenarioKey(b);
    const a = afterMap.get(key);
    const beforeDps = b.dps.dps;
    const afterDps = a ? a.dps.dps : beforeDps;
    const change = afterDps - beforeDps;
    const changePercent = beforeDps === 0 ? 0 : (change / beforeDps) * 100;
    const uncappedBefore = b.dps.uncappedDps;
    const uncappedAfter = a ? a.dps.uncappedDps : uncappedBefore;
    const uncappedChange = uncappedAfter - uncappedBefore;
    const uncappedChangePercent = uncappedBefore === 0 ? 0 : (uncappedChange / uncappedBefore) * 100;

    deltas.push({
      className: b.className,
      skillName: b.skillName,
      scenario: b.scenario,
      before: beforeDps,
      after: afterDps,
      change,
      changePercent,
      uncappedBefore,
      uncappedAfter,
      uncappedChange,
      uncappedChangePercent,
      rankBefore: beforeRanks.get(key),
      rankAfter: afterRanks.get(key),
    });
  }

  for (const a of after) {
    const key = scenarioKey(a);
    if (beforeMap.has(key)) continue;

    const afterDps = a.dps.dps;
    const uncappedAfter = a.dps.uncappedDps;

    deltas.push({
      className: a.className,
      skillName: a.skillName,
      scenario: a.scenario,
      before: 0,
      after: afterDps,
      change: afterDps,
      changePercent: 0,
      uncappedBefore: 0,
      uncappedAfter,
      uncappedChange: uncappedAfter,
      uncappedChangePercent: 0,
      rankBefore: undefined,
      rankAfter: afterRanks.get(key),
    });
  }

  return deltas;
}

/**
 * Compute DPS rank per scenario group.
 * Returns a map of scenarioKey → rank (1-based, highest DPS = rank 1).
 */
function computeRanks(results: ScenarioResult[]): Map<string, number> {
  // Group by scenario
  const groups = new Map<string, ScenarioResult[]>();
  for (const r of results) {
    const groupKey = r.scenario;
    const group = groups.get(groupKey);
    if (group) {
      group.push(r);
    } else {
      groups.set(groupKey, [r]);
    }
  }

  const ranks = new Map<string, number>();
  for (const group of groups.values()) {
    const sorted = [...group].sort((a, b) => b.dps.dps - a.dps.dps);
    for (let i = 0; i < sorted.length; i++) {
      ranks.set(scenarioKey(sorted[i]), i + 1);
    }
  }

  return ranks;
}
