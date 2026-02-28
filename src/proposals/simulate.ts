import type {
  ClassSkillData,
  CharacterBuild,
  WeaponData,
  AttackSpeedData,
  MapleWarriorData,
} from '../data/types.js';
import { calculateSkillDps } from '../engine/dps.js';
import type { ScenarioResult } from './types.js';

/** Configuration for which classes/tiers to simulate. */
export interface SimulationConfig {
  /** Class names to include (lowercase keys matching classDataMap). */
  classes: string[];
  /** Tier names to simulate (must match gear template naming, e.g. ["low", "high"]). */
  tiers: string[];
}

/** Map of "className-tier" → CharacterBuild. */
export type GearTemplateMap = Map<string, CharacterBuild>;

/**
 * Run a simulation across all classes × tiers × skills.
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
  const results: ScenarioResult[] = [];

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

      for (const skill of classData.skills) {
        const dps = calculateSkillDps(
          build,
          classData,
          skill,
          weaponData,
          attackSpeedData,
          mapleWarriorData
        );
        results.push({
          className: classData.className,
          skillName: skill.name,
          tier,
          dps,
        });
      }
    }
  }

  return results;
}
