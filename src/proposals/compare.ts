import type {
  ClassSkillData,
  WeaponData,
  AttackSpeedData,
  MapleWarriorData,
} from '../data/types.js';
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
  mapleWarriorData: MapleWarriorData
): ComparisonResult {
  // Run "before" simulation
  const before = runSimulation(
    config,
    classDataMap,
    gearTemplates,
    weaponData,
    attackSpeedData,
    mapleWarriorData
  );

  // Apply proposal and run "after" simulation
  const modifiedClassData = applyProposal(classDataMap, proposal);
  const after = runSimulation(
    config,
    modifiedClassData,
    gearTemplates,
    weaponData,
    attackSpeedData,
    mapleWarriorData
  );

  // Compute deltas
  const deltas = computeDeltas(before, after);

  return { proposal, before, after, deltas };
}

function scenarioKey(r: ScenarioResult): string {
  return `${r.scenario}|${r.className}|${r.skillName}|${r.tier}`;
}

function computeDeltas(
  before: ScenarioResult[],
  after: ScenarioResult[]
): DeltaEntry[] {
  const afterMap = new Map<string, ScenarioResult>();
  for (const r of after) {
    afterMap.set(scenarioKey(r), r);
  }

  return before.map((b) => {
    const a = afterMap.get(scenarioKey(b));
    const beforeDps = b.dps.dps;
    const afterDps = a ? a.dps.dps : beforeDps;
    const change = afterDps - beforeDps;
    const changePercent = beforeDps === 0 ? 0 : (change / beforeDps) * 100;

    return {
      className: b.className,
      skillName: b.skillName,
      tier: b.tier,
      scenario: b.scenario,
      before: beforeDps,
      after: afterDps,
      change,
      changePercent,
    };
  });
}
