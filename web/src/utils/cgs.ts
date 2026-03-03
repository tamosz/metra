import type { CharacterBuild, ClassSkillData } from '@engine/data/types.js';

export interface CgsValues {
  cape: number;
  glove: number;
  shoe: number;
}

export const CGS_DEFAULTS: Record<string, CgsValues> = {
  low: { cape: 10, glove: 12, shoe: 10 },
  mid: { cape: 15, glove: 16, shoe: 13 },
  high: { cape: 20, glove: 18, shoe: 16 },
  perfect: { cape: 22, glove: 22, shoe: 18 },
};

export function applyCgsOverride(
  templates: Map<string, CharacterBuild>,
  classDataMap: Map<string, ClassSkillData>,
  classNames: string[],
  tier: string,
  cgs: CgsValues,
): Map<string, CharacterBuild> {
  const defaults = CGS_DEFAULTS[tier];
  if (!defaults) return templates;

  const defaultSum = defaults.cape + defaults.glove + defaults.shoe;
  const userSum = cgs.cape + cgs.glove + cgs.shoe;
  const delta = userSum - defaultSum;

  if (delta === 0) return templates;

  const result = new Map(templates);
  for (const className of classNames) {
    const key = `${className}-${tier}`;
    const build = result.get(key);
    if (!build) continue;

    const classData = classDataMap.get(className);
    if (classData?.damageFormula === 'magic') continue;

    result.set(key, {
      ...build,
      totalWeaponAttack: build.totalWeaponAttack + delta,
    });
  }
  return result;
}
