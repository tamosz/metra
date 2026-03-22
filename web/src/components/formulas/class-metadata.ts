import { discoveredData, allClassBases } from '../../data/bundle.js';

export interface ClassMetadata {
  className: string;
  classKey: string;
  weaponType: string;
  damageFormula: 'standard' | 'throwingStar' | 'magic';
  hasStance: boolean;
  hasShifter: boolean;
  hasShadowPartner: boolean;
  builtInCritRate: number;
}

export function getClassMetadata(classKey: string): ClassMetadata | null {
  const classData = discoveredData.classDataMap.get(classKey);
  const base = allClassBases.get(classKey);
  if (!classData || !base) return null;

  const builtInCritSkill = classData.skills.find(
    (s) => s.builtInCritRate && s.builtInCritRate > 0
  );

  return {
    className: classData.className,
    classKey,
    weaponType: base.weaponType,
    damageFormula: (classData.damageFormula ?? 'standard') as ClassMetadata['damageFormula'],
    hasStance: (classData.stanceRate ?? 0) > 0,
    hasShifter: (classData.shadowShifterRate ?? 0) > 0,
    hasShadowPartner: classData.className === 'Night Lord',
    builtInCritRate: builtInCritSkill?.builtInCritRate ?? 0,
  };
}

/** Map damage formula type to the tab ID used in DamageRangeSection */
export function damageFormulaToTab(formula: ClassMetadata['damageFormula']): string {
  switch (formula) {
    case 'throwingStar':
      return 'throwingStar';
    case 'magic':
      return 'magic';
    default:
      return 'standard';
  }
}

/** Map damage formula type to the attack calculation tab */
export function damageFormulaToAttackTab(formula: ClassMetadata['damageFormula']): string {
  return formula === 'magic' ? 'mage' : 'physical';
}
