import type {
  ClassSkillData,
  CharacterBuild,
  WeaponData,
  AttackSpeedData,
  MapleWarriorData,
} from '../data/types.js';
import { calculateSkillDps } from '../engine/dps.js';
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

        for (const skill of classData.skills) {
          const dps = calculateSkillDps(
            effectiveBuild,
            classData,
            skill,
            weaponData,
            attackSpeedData,
            mapleWarriorData
          );

          const effectiveDps =
            scenario.pdr != null
              ? { ...dps, dps: dps.dps * (1 - scenario.pdr), averageDamage: dps.averageDamage * (1 - scenario.pdr) }
              : dps;

          results.push({
            className: classData.className,
            skillName: skill.name,
            tier,
            scenario: scenario.name,
            dps: effectiveDps,
          });
        }
      }
    }
  }

  return results;
}
