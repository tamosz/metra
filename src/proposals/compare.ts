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

/** Null-byte separated composite key — uniquely identifies a result across scenario/class/skill/tier.
 *  Uses comparisonKey (from elementVariantGroup) when available so the key stays stable
 *  even when a different variant wins before vs after a proposal. */
function scenarioKey(r: ScenarioResult): string {
  const effectiveSkillName = r.comparisonKey ?? r.skillName;
  return `${r.scenario}\0${r.className}\0${effectiveSkillName}\0${r.tier}`;
}

export function computeDeltas(
  before: ScenarioResult[],
  after: ScenarioResult[]
): DeltaEntry[] {
  const afterMap = new Map<string, ScenarioResult>();
  for (const r of after) {
    afterMap.set(scenarioKey(r), r);
  }

  // Compute ranks per (scenario, tier) group
  const beforeRanks = computeRanks(before);
  const afterRanks = computeRanks(after);

  return before.map((b) => {
    const a = afterMap.get(scenarioKey(b));
    const beforeDps = b.dps.dps;
    const afterDps = a ? a.dps.dps : beforeDps;
    const change = afterDps - beforeDps;
    const changePercent = beforeDps === 0 ? 0 : (change / beforeDps) * 100;
    const key = scenarioKey(b);

    return {
      className: b.className,
      skillName: b.skillName,
      tier: b.tier,
      scenario: b.scenario,
      before: beforeDps,
      after: afterDps,
      change,
      changePercent,
      rankBefore: beforeRanks.get(key),
      rankAfter: afterRanks.get(key),
    };
  });
}

/**
 * Compute DPS rank per (scenario, tier) group.
 * Returns a map of scenarioKey → rank (1-based, highest DPS = rank 1).
 */
function computeRanks(results: ScenarioResult[]): Map<string, number> {
  // Group by (scenario, tier) using null-byte separated composite keys
  const groups = new Map<string, ScenarioResult[]>();
  for (const r of results) {
    const groupKey = `${r.scenario}\0${r.tier}`;
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
