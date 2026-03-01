import type {
  ClassSkillData,
  CharacterBuild,
  WeaponData,
  AttackSpeedData,
  MapleWarriorData,
  SkillEntry,
} from '../data/types.js';
import { calculateSkillDps, type DpsResult } from '../engine/dps.js';
import type { ScenarioConfig, ScenarioResult } from './types.js';

/** Default scenario: fully buffed, no overrides. */
const DEFAULT_SCENARIOS: ScenarioConfig[] = [{ name: 'Buffed' }];

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
  return { ...dps, dps: dps.dps * (1 - pdr), averageDamage: dps.averageDamage * (1 - pdr) };
}

/**
 * Apply elemental damage modifier to a DPS result.
 * Returns a new result with DPS and averageDamage scaled by the modifier.
 */
function applyElementModifier(dps: DpsResult, modifier: number): DpsResult {
  return { ...dps, dps: dps.dps * modifier, averageDamage: dps.averageDamage * modifier };
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
  mapleWarriorData: MapleWarriorData
): ScenarioResult[] {
  const scenarios = config.scenarios ?? DEFAULT_SCENARIOS;
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
        for (const skill of classData.skills) {
          const dps = calculateSkillDps(
            effectiveBuild,
            classData,
            skill,
            weaponData,
            attackSpeedData,
            mapleWarriorData
          );

          let effectiveDps = scenario.pdr != null ? applyPdr(dps, scenario.pdr) : dps;
          if (scenario.elementModifiers && skill.element) {
            const mod = scenario.elementModifiers[skill.element] ?? 1;
            if (mod !== 1) effectiveDps = applyElementModifier(effectiveDps, mod);
          }

          skillResults.push({
            skill,
            result: {
              className: classData.className,
              skillName: skill.name,
              tier,
              scenario: scenario.name,
              dps: effectiveDps,
            },
          });
        }

        // Aggregate comboGroup skills: sum DPS for skills sharing the same group
        const grouped = aggregateComboGroups(skillResults);
        results.push(...grouped);
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
      },
    });
  }

  return output;
}
