import type { CharacterBuild, ClassSkillData, StatName } from '@engine/data/types.js';
import type { CustomTier, CustomTierAdjustments } from '../types/custom-tier.js';

/**
 * Apply custom tier adjustments to a base gear template.
 * Primary/secondary stat deltas are resolved using the class's stat mapping.
 */
export function applyCustomTierToTemplate(
  baseTemplate: CharacterBuild,
  classData: ClassSkillData,
  adjustments: CustomTierAdjustments
): CharacterBuild {
  const primary = classData.primaryStat;
  const secondaryStats: StatName[] = Array.isArray(classData.secondaryStat)
    ? classData.secondaryStat
    : [classData.secondaryStat];

  const newBaseStats = { ...baseTemplate.baseStats };
  newBaseStats[primary] += adjustments.primaryStatDelta;
  for (const stat of secondaryStats) {
    newBaseStats[stat] += adjustments.secondaryStatDelta;
  }

  return {
    ...baseTemplate,
    baseStats: newBaseStats,
    totalWeaponAttack: baseTemplate.totalWeaponAttack + adjustments.watkDelta,
    attackPotion: adjustments.attackPotion ?? baseTemplate.attackPotion,
    echoActive: adjustments.echoActive ?? baseTemplate.echoActive,
    sharpEyes: adjustments.sharpEyes ?? baseTemplate.sharpEyes,
    speedInfusion: adjustments.speedInfusion ?? baseTemplate.speedInfusion,
    mwLevel: adjustments.mwLevel ?? baseTemplate.mwLevel,
  };
}

/**
 * Generate synthetic gear templates for all classes from a custom tier definition.
 * Returns entries keyed as `${className}-${customTier.id}`.
 */
export function generateCustomTierTemplates(
  customTier: CustomTier,
  classNames: string[],
  classDataMap: Map<string, ClassSkillData>,
  gearTemplates: Map<string, CharacterBuild>
): Map<string, CharacterBuild> {
  const result = new Map<string, CharacterBuild>();

  for (const className of classNames) {
    const baseKey = `${className}-${customTier.baseTier}`;
    const baseTemplate = gearTemplates.get(baseKey);
    const classData = classDataMap.get(className);

    if (!baseTemplate || !classData) continue;

    const syntheticBuild = applyCustomTierToTemplate(
      baseTemplate,
      classData,
      customTier.adjustments
    );
    result.set(`${className}-${customTier.id}`, syntheticBuild);
  }

  return result;
}
