import {
  calculateSkillDps,
  calculateDodgeChance,
  calculateKnockbackProbability,
  calculateKnockbackUptime,
  getKnockbackRecovery,
  type ClassSkillData,
  type CharacterBuild,
  type GameData,
  type MixedRotation,
  type SkillEntry,
  type DpsResult,
} from '@metra/engine';
import type { ScenarioConfig, ScenarioResult } from './types.js';

/** Fallback scenario when none is provided: fully buffed, no overrides. */
const FALLBACK_SCENARIO: ScenarioConfig[] = [{ name: 'Buffed' }];

/** Configuration for which classes to simulate. */
export interface SimulationConfig {
  /** Class names to include (lowercase keys matching classDataMap). */
  classes: string[];
  /** Scenarios to evaluate. Defaults to a single "Buffed" scenario with no overrides. */
  scenarios?: ScenarioConfig[];
}

/** Map of className → CharacterBuild. */
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
 * Scale a DPS result's damage values (dps, averageDamage, uncappedDps) by a factor.
 * Used for PDR, multi-target scaling, and knockback uptime.
 */
export function scaleDpsResult(result: DpsResult, factor: number): DpsResult {
  return {
    ...result,
    dps: result.dps * factor,
    averageDamage: result.averageDamage * factor,
    uncappedDps: result.uncappedDps * factor,
  };
}

/**
 * Compute the multi-target scaling factor.
 * When bounceDecay is in (0, 1), uses a geometric series:
 *   multiplier = (1 - d^n) / (1 - d)
 * Otherwise, flat linear scaling by effectiveTargets.
 */
export function targetCountFactor(effectiveTargets: number, bounceDecay?: number): number {
  if (bounceDecay != null && bounceDecay > 0 && bounceDecay < 1) {
    const clamped = Math.max(0.01, bounceDecay);
    return (1 - clamped ** effectiveTargets) / (1 - clamped);
  }
  return effectiveTargets;
}

/**
 * Run a simulation across all classes × skills × scenarios.
 * Returns a ScenarioResult for each combination.
 */
export function runSimulation(
  config: SimulationConfig,
  classDataMap: Map<string, ClassSkillData>,
  gearTemplates: GearTemplateMap,
  gameData: GameData,
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

      const build = gearTemplates.get(className);
      if (!build) {
        throw new Error(
          `Build for "${className}" not found. Available: ${[...gearTemplates.keys()].join(', ')}`
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
        let selectedElement: string | undefined;
        if (scenario.elementModifiers && skill.element) {
          elementModifier = scenario.elementModifiers[skill.element] ?? 1;
        } else if (scenario.elementModifiers && skill.elementOptions) {
          let bestMod = 1;
          for (const e of skill.elementOptions) {
            const mod = scenario.elementModifiers![e] ?? 1;
            if (mod > bestMod) {
              bestMod = mod;
              selectedElement = e;
            }
          }
          elementModifier = bestMod;
        }

        const dps = calculateSkillDps(
          effectiveBuild,
          classData,
          skill,
          gameData,
          elementModifier
        );

        let effectiveDps = scenario.pdr != null
          ? scaleDpsResult(dps, 1 - scenario.pdr)
          : dps;
        if (scenario.targetCount != null && scenario.targetCount > 1) {
          const effectiveTargets = Math.min(skill.maxTargets ?? 1, scenario.targetCount);
          if (effectiveTargets > 1) effectiveDps = scaleDpsResult(effectiveDps, targetCountFactor(effectiveTargets, skill.bounceDecay));
        }
        if (scenario.bossAttackInterval != null && scenario.bossAttackInterval > 0) {
          const isThief = (classData.shadowShifterRate ?? 0) > 0;
          const dodgeChance = calculateDodgeChance(
            effectiveBuild.avoidability ?? 0,
            scenario.bossAccuracy ?? Infinity,
            isThief ? { minDodge: 0.05, maxDodge: 0.95 } : undefined
          );
          const kbProb = calculateKnockbackProbability(
            dodgeChance,
            classData.stanceRate ?? 0,
            classData.shadowShifterRate ?? 0
          );
          const recovery = getKnockbackRecovery(skill, effectiveDps.attackTime);
          const uptime = calculateKnockbackUptime(kbProb, scenario.bossAttackInterval, recovery);
          effectiveDps = scaleDpsResult(effectiveDps, uptime);
        }

        let resolvedSkillName = skill.name;
        if (selectedElement && skill.nameTemplate) {
          resolvedSkillName = skill.nameTemplate.replace('{element}', selectedElement);
        }

        const isHeadline = skill.headline !== false;
        const effectiveMaxTargets = skill.maxTargets ?? 1;
        const result: ScenarioResult = {
          className: classData.className,
          skillName: resolvedSkillName,
          scenario: scenario.name,
          dps: effectiveDps,
          ...(skill.description ? { description: skill.description } : {}),
          ...(isHeadline ? {} : { headline: false }),
          ...(effectiveMaxTargets > 1 ? { maxTargets: effectiveMaxTargets } : {}),
        };

        // Store all skills (including hidden) for mixed rotation lookups
        skillResultsByName.set(skill.name, result);

        if (!skill.hidden) {
          skillResults.push({ skill, result });
        }
      }

      // Resolve element variant groups: keep only the highest-DPS variant
      const variantResolved = resolveElementVariantGroups(skillResults);
      // Aggregate comboGroup skills: sum DPS for skills sharing the same group
      const grouped = aggregateComboGroups(variantResolved);
      results.push(...grouped);

      // Process mixed rotations
      if (classData.mixedRotations) {
        const mixedResults = processMixedRotations(
          classData.mixedRotations,
          skillResultsByName,
          classData.className,
          scenario,
        );
        results.push(...mixedResults);
      }
    }
  }

  return results;
}

/**
 * Resolve element variant groups: skills sharing an elementVariantGroup
 * compete on DPS, and only the highest-DPS variant survives.
 * The winning result is always treated as headline.
 */
function resolveElementVariantGroups(
  skillResults: { skill: SkillEntry; result: ScenarioResult }[]
): { skill: SkillEntry; result: ScenarioResult }[] {
  const output: { skill: SkillEntry; result: ScenarioResult }[] = [];
  const variantMap = new Map<string, { skill: SkillEntry; result: ScenarioResult }[]>();

  for (const entry of skillResults) {
    const group = entry.skill.elementVariantGroup;
    if (group) {
      const existing = variantMap.get(group);
      if (existing) {
        existing.push(entry);
      } else {
        variantMap.set(group, [entry]);
      }
    } else {
      output.push(entry);
    }
  }

  for (const [group, entries] of variantMap) {
    // Ties go to the first variant in the skills array (typically the base/Holy variant)
    const winner = entries.reduce((best, entry) =>
      entry.result.dps.dps > best.result.dps.dps ? entry : best
    );
    // Merged result is always headline — strip headline: false if present
    const { headline: _, ...resultWithoutHeadline } = winner.result;
    output.push({ skill: winner.skill, result: { ...resultWithoutHeadline, comparisonKey: group } });
  }

  return output;
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
  const comboMap = new Map<string, { skills: SkillEntry[]; results: ScenarioResult[] }>();

  for (const { skill, result } of skillResults) {
    if (skill.comboGroup) {
      const existing = comboMap.get(skill.comboGroup);
      if (existing) {
        existing.skills.push(skill);
        existing.results.push(result);
      } else {
        comboMap.set(skill.comboGroup, { skills: [skill], results: [result] });
      }
    } else {
      output.push(result);
    }
  }

  for (const [groupName, { skills, results: groupResults }] of comboMap) {
    const first = groupResults[0];
    const totalDps = groupResults.reduce((sum, r) => sum + r.dps.dps, 0);
    const totalAvgDamage = groupResults.reduce((sum, r) => sum + r.dps.averageDamage, 0);
    const totalUncappedDps = groupResults.reduce((sum, r) => sum + r.dps.uncappedDps, 0);
    const capLossPercent = totalUncappedDps > 0 ? ((totalUncappedDps - totalDps) / totalUncappedDps) * 100 : 0;
    const isHeadline = skills.some(s => s.headline !== false);
    const comboMaxTargets = Math.max(...skills.map(s => s.maxTargets ?? 1));

    output.push({
      className: first.className,
      skillName: groupName,
      scenario: first.scenario,
      ...(isHeadline ? {} : { headline: false }),
      ...(comboMaxTargets > 1 ? { maxTargets: comboMaxTargets } : {}),
      isComposite: true,
      comboSubResults: groupResults.map((r) => ({
        skillName: r.skillName,
        dps: r.dps,
      })),
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
  scenario: ScenarioConfig,
): ScenarioResult[] {
  const output: ScenarioResult[] = [];

  for (const rotation of mixedRotations) {
    // Check for efficiency override
    const overrideKey = `${className}.${rotation.name}`;
    const override = scenario.efficiencyOverrides?.[overrideKey];
    const useOverride = override != null && override.length === rotation.components.length;

    const componentResults: { result: ScenarioResult; weight: number }[] = [];
    let valid = true;

    for (let i = 0; i < rotation.components.length; i++) {
      const component = rotation.components[i];
      const result = allSkillResults.get(component.skill);
      if (!result) {
        valid = false;
        break;
      }
      componentResults.push({ result, weight: useOverride ? override![i] : component.weight });
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

    const isHeadline = rotation.headline !== false;
    const rotationMaxTargets = Math.max(...componentResults.map(c => c.result.maxTargets ?? 1));
    const first = componentResults[0].result;
    output.push({
      className,
      skillName: rotation.name,
      scenario: scenario.name,
      description: rotation.description,
      ...(isHeadline ? {} : { headline: false }),
      ...(rotationMaxTargets > 1 ? { maxTargets: rotationMaxTargets } : {}),
      isComposite: true,
      comboSubResults: componentResults.map(({ result, weight }) => ({
        skillName: result.skillName,
        dps: result.dps,
        weight,
      })),
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
