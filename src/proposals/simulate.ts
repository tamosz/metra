import type {
  ClassSkillData,
  CharacterBuild,
  WeaponData,
  AttackSpeedData,
  MWData,
  MixedRotation,
  SkillEntry,
} from '../data/types.js';
import { calculateSkillDps, type DpsResult } from '../engine/dps.js';
import {
  calculateDodgeChance,
  calculateKnockbackProbability,
  calculateKnockbackUptime,
  getKnockbackRecovery,
} from '../engine/knockback.js';
import type { ScenarioConfig, ScenarioResult } from './types.js';

/** Fallback scenario when none is provided: fully buffed, no overrides. */
const FALLBACK_SCENARIO: ScenarioConfig[] = [{ name: 'Buffed' }];

/** Configuration for which classes/tiers to simulate. */
export interface SimulationConfig {
  /** Class names to include (lowercase keys matching classDataMap). */
  classes: string[];
  /** Tier names to simulate (must match gear template naming, e.g. ["low", "high"]). */
  tiers: string[];
  /** Scenarios to evaluate. Defaults to a single "Buffed" scenario with no overrides. */
  scenarios?: ScenarioConfig[];
}

/** Map of "className-tier" → CharacterBuild. */
export type GearTemplateMap = Map<string, CharacterBuild>;

/**
 * Apply scenario overrides to a character build, returning a new build.
 */
function applyScenarioOverrides(
  build: CharacterBuild,
  scenario: ScenarioConfig
): CharacterBuild {
  if (!scenario.overrides) return build;
  return { ...build, ...scenario.overrides };
}

/**
 * Apply Physical Damage Reduction to a DPS result.
 * Returns a new result with DPS and averageDamage scaled by (1 - pdr).
 */
function applyPdr(dps: DpsResult, pdr: number): DpsResult {
  const factor = 1 - pdr;
  return { ...dps, dps: dps.dps * factor, averageDamage: dps.averageDamage * factor, uncappedDps: dps.uncappedDps * factor };
}


/**
 * Apply multi-target scaling to a DPS result.
 * effectiveTargets = min(skill.maxTargets, scenario.targetCount).
 */
function applyTargetCount(dps: DpsResult, effectiveTargets: number): DpsResult {
  return { ...dps, dps: dps.dps * effectiveTargets, averageDamage: dps.averageDamage * effectiveTargets, uncappedDps: dps.uncappedDps * effectiveTargets };
}

/**
 * Apply knockback uptime multiplier to a DPS result.
 * Returns a new result with DPS and averageDamage scaled by the uptime factor.
 */
function applyKnockbackUptime(dps: DpsResult, uptimeMultiplier: number): DpsResult {
  return { ...dps, dps: dps.dps * uptimeMultiplier, averageDamage: dps.averageDamage * uptimeMultiplier, uncappedDps: dps.uncappedDps * uptimeMultiplier };
}

/**
 * Run a simulation across all classes × tiers × skills × scenarios.
 * Returns a ScenarioResult for each combination.
 */
export function runSimulation(
  config: SimulationConfig,
  classDataMap: Map<string, ClassSkillData>,
  gearTemplates: GearTemplateMap,
  weaponData: WeaponData,
  attackSpeedData: AttackSpeedData,
  mwData: MWData
): ScenarioResult[] {
  const scenarios = config.scenarios ?? FALLBACK_SCENARIO;
  const results: ScenarioResult[] = [];

  for (const scenario of scenarios) {
    for (const className of config.classes) {
      const classData = classDataMap.get(className);
      if (!classData) {
        throw new Error(
          `Class "${className}" not found in classDataMap. Available: ${[...classDataMap.keys()].join(', ')}`
        );
      }

      for (const tier of config.tiers) {
        const templateKey = `${className}-${tier}`;
        const build = gearTemplates.get(templateKey);
        if (!build) {
          throw new Error(
            `Gear template "${templateKey}" not found. Available: ${[...gearTemplates.keys()].join(', ')}`
          );
        }

        const effectiveBuild = applyScenarioOverrides(build, scenario);

        // Compute DPS for each individual skill
        const skillResults: { skill: SkillEntry; result: ScenarioResult }[] = [];
        const skillResultsByName = new Map<string, ScenarioResult>();

        for (const skill of classData.skills) {
          // Compute element modifier before DPS calculation so it interacts
          // with the per-line damage cap (199,999).
          let elementModifier = 1;
          if (scenario.elementModifiers && skill.element) {
            elementModifier = scenario.elementModifiers[skill.element] ?? 1;
          } else if (scenario.elementModifiers && skill.elementOptions) {
            elementModifier = Math.max(
              ...skill.elementOptions.map(e => scenario.elementModifiers![e] ?? 1)
            );
          }

          const dps = calculateSkillDps(
            effectiveBuild,
            classData,
            skill,
            weaponData,
            attackSpeedData,
            mwData,
            elementModifier
          );

          let effectiveDps = scenario.pdr != null ? applyPdr(dps, scenario.pdr) : dps;
          if (scenario.targetCount != null && scenario.targetCount > 1) {
            const effectiveTargets = Math.min(skill.maxTargets ?? 1, scenario.targetCount);
            if (effectiveTargets > 1) effectiveDps = applyTargetCount(effectiveDps, effectiveTargets);
          }
          if (scenario.bossAttackInterval != null && scenario.bossAttackInterval > 0) {
            const dodgeChance = calculateDodgeChance(
              effectiveBuild.avoidability ?? 0,
              scenario.bossAccuracy ?? Infinity
            );
            const kbProb = calculateKnockbackProbability(
              dodgeChance,
              classData.stanceRate ?? 0,
              classData.shadowShifterRate ?? 0
            );
            const recovery = getKnockbackRecovery(skill, effectiveDps.attackTime);
            const uptime = calculateKnockbackUptime(kbProb, scenario.bossAttackInterval, recovery);
            effectiveDps = applyKnockbackUptime(effectiveDps, uptime);
          }

          const result: ScenarioResult = {
            className: classData.className,
            skillName: skill.name,
            tier,
            scenario: scenario.name,
            dps: effectiveDps,
          };

          // Store all skills (including hidden) for mixed rotation lookups
          skillResultsByName.set(skill.name, result);

          if (!skill.hidden) {
            skillResults.push({ skill, result });
          }
        }

        // Aggregate comboGroup skills: sum DPS for skills sharing the same group
        const grouped = aggregateComboGroups(skillResults);
        results.push(...grouped);

        // Process mixed rotations
        if (classData.mixedRotations) {
          const mixedResults = processMixedRotations(
            classData.mixedRotations,
            skillResultsByName,
            classData.className,
            tier,
            scenario.name,
          );
          results.push(...mixedResults);
        }
      }
    }
  }

  return results;
}

/**
 * Aggregate skills that share a comboGroup into a single result.
 * Non-grouped skills pass through unchanged.
 * Grouped skills have their DPS and averageDamage summed; the group name
 * becomes the skillName. Other DpsResult fields are taken from the first
 * skill in the group (attackTime, damageRange, etc. are not meaningful
 * for the aggregate but kept for structural compatibility).
 */
function aggregateComboGroups(
  skillResults: { skill: SkillEntry; result: ScenarioResult }[]
): ScenarioResult[] {
  const output: ScenarioResult[] = [];
  const comboMap = new Map<string, ScenarioResult[]>();

  for (const { skill, result } of skillResults) {
    if (skill.comboGroup) {
      const existing = comboMap.get(skill.comboGroup);
      if (existing) {
        existing.push(result);
      } else {
        comboMap.set(skill.comboGroup, [result]);
      }
    } else {
      output.push(result);
    }
  }

  for (const [groupName, groupResults] of comboMap) {
    const first = groupResults[0];
    const totalDps = groupResults.reduce((sum, r) => sum + r.dps.dps, 0);
    const totalAvgDamage = groupResults.reduce((sum, r) => sum + r.dps.averageDamage, 0);
    const totalUncappedDps = groupResults.reduce((sum, r) => sum + r.dps.uncappedDps, 0);
    const capLossPercent = totalUncappedDps > 0 ? ((totalUncappedDps - totalDps) / totalUncappedDps) * 100 : 0;

    output.push({
      className: first.className,
      skillName: groupName,
      tier: first.tier,
      scenario: first.scenario,
      dps: {
        ...first.dps,
        skillName: groupName,
        dps: totalDps,
        averageDamage: totalAvgDamage,
        uncappedDps: totalUncappedDps,
        capLossPercent,
      },
    });
  }

  return output;
}

/**
 * Process mixed rotations: create synthetic results by weighting
 * already-computed individual skill DPS values.
 * Unlike comboGroups (fixed rotation cycles), mixed rotations represent
 * time-weighted estimates of how much each skill is used in practice.
 */
function processMixedRotations(
  mixedRotations: MixedRotation[],
  allSkillResults: Map<string, ScenarioResult>,
  className: string,
  tier: string,
  scenario: string,
): ScenarioResult[] {
  const output: ScenarioResult[] = [];

  for (const rotation of mixedRotations) {
    const componentResults: { result: ScenarioResult; weight: number }[] = [];
    let valid = true;

    for (const component of rotation.components) {
      const result = allSkillResults.get(component.skill);
      if (!result) {
        valid = false;
        break;
      }
      componentResults.push({ result, weight: component.weight });
    }

    if (!valid || componentResults.length === 0) continue;

    const weightedDps = componentResults.reduce(
      (sum, { result, weight }) => sum + result.dps.dps * weight,
      0,
    );
    const weightedUncappedDps = componentResults.reduce(
      (sum, { result, weight }) => sum + result.dps.uncappedDps * weight,
      0,
    );
    const weightedAvgDamage = componentResults.reduce(
      (sum, { result, weight }) => sum + result.dps.averageDamage * weight,
      0,
    );
    const capLossPercent = weightedUncappedDps > 0
      ? Math.max(0, ((weightedUncappedDps - weightedDps) / weightedUncappedDps) * 100)
      : 0;

    const first = componentResults[0].result;
    output.push({
      className,
      skillName: rotation.name,
      tier,
      scenario,
      description: rotation.description,
      dps: {
        ...first.dps,
        skillName: rotation.name,
        dps: weightedDps,
        uncappedDps: weightedUncappedDps,
        averageDamage: weightedAvgDamage,
        capLossPercent,
      },
    });
  }

  return output;
}
