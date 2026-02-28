import type {
  CharacterBuild,
  ClassSkillData,
  SkillEntry,
  WeaponData,
  AttackSpeedData,
  MapleWarriorData,
} from '../data/types.js';
import { calculateTotalAttack, calculateTotalStats } from './buffs.js';
import {
  calculateDamageRange,
  calculateAdjustedRange,
  calculateRangeCap,
  getWeaponMultiplier,
  type DamageRange,
} from './damage.js';
import {
  resolveEffectiveWeaponSpeed,
  lookupAttackTime,
} from './attack-speed.js';

/** Default damage cap from dmg sheet B1. */
const DAMAGE_CAP = 199999;

export interface DpsResult {
  /** Skill name. */
  skillName: string;
  /** Attack time in seconds. */
  attackTime: number;
  /** Damage range (min/max/average). */
  damageRange: DamageRange;
  /** Skill damage% without crit. */
  skillDamagePercent: number;
  /** Skill damage% with SE crit. */
  seDamagePercent: number;
  /** Adjusted range for normal hits. */
  adjustedRange: number;
  /** Adjusted range for SE crit hits. */
  adjustedRangeSe: number;
  /** Average damage per attack (all lines). */
  averageDamage: number;
  /** DPS (average damage / attack time). */
  dps: number;
}

/**
 * Calculate DPS for a single skill.
 *
 * Source: dmg sheet columns D→O, row 15 for Hero Brandish (Sword)
 *
 * Chain:
 * 1. Attack time from Attack Speed table lookup
 * 2. Skill damage% = basePower * multiplier
 * 3. SE damage% = (basePower + seCritBonus) * multiplier
 * 4. Range caps = damageCap / skillDmg%
 * 5. Adjusted range (accounts for damage capping)
 * 6. Average damage = (normalDmg * normalRate + critDmg * critRate) * hitCount
 * 7. DPS = avgDamage / attackTime
 */
export function calculateSkillDps(
  build: CharacterBuild,
  classData: ClassSkillData,
  skill: SkillEntry,
  weaponData: WeaponData,
  attackSpeedData: AttackSpeedData,
  mapleWarriorData: MapleWarriorData
): DpsResult {
  // 1. Attack time
  const effectiveSpeed = resolveEffectiveWeaponSpeed(
    build.weaponSpeed,
    build.speedInfusion
  );
  const attackTime = lookupAttackTime(
    attackSpeedData,
    effectiveSpeed,
    skill.speedCategory
  );

  // 2-3. Skill damage percentages
  const skillDamagePercent = skill.basePower * skill.multiplier;

  // SE crit damage formula varies by class:
  // Hero/DrK (addBeforeMultiply, default): seDmg% = (basePower + bonus) * multiplier
  // Paladin (addAfterMultiply): seDmg% = basePower * multiplier + bonus
  const seCritFormula = classData.seCritFormula ?? 'addBeforeMultiply';
  const seDamagePercent =
    seCritFormula === 'addAfterMultiply'
      ? skill.basePower * skill.multiplier + classData.sharpEyesCritDamageBonus
      : (skill.basePower + classData.sharpEyesCritDamageBonus) * skill.multiplier;

  // Damage range
  const weaponMultiplier = getWeaponMultiplier(weaponData, build.weaponType);
  const totalAttack = calculateTotalAttack(build);
  const { primary, secondary } = calculateTotalStats(build, mapleWarriorData);
  const damageRange = calculateDamageRange(
    primary,
    secondary,
    weaponMultiplier,
    classData.mastery,
    totalAttack
  );

  // 4. Range caps
  const rangeCap = calculateRangeCap(DAMAGE_CAP, skillDamagePercent);
  const rangeCapSe = calculateRangeCap(DAMAGE_CAP, seDamagePercent);

  // 5. Adjusted ranges
  const adjustedRange = calculateAdjustedRange(damageRange, rangeCap);
  const adjustedRangeSe = calculateAdjustedRange(damageRange, rangeCapSe);

  // 6. Average damage per attack
  let averageDamage: number;
  if (build.sharpEyes) {
    const normalRate = 1 - classData.sharpEyesCritRate;
    const critRate = classData.sharpEyesCritRate;
    averageDamage =
      ((skillDamagePercent / 100) * normalRate * adjustedRange +
        (seDamagePercent / 100) * critRate * adjustedRangeSe) *
      skill.hitCount;
  } else {
    averageDamage =
      (skillDamagePercent / 100) * adjustedRange * skill.hitCount;
  }

  // 7. DPS
  const dps = averageDamage / attackTime;

  return {
    skillName: skill.name,
    attackTime,
    damageRange,
    skillDamagePercent,
    seDamagePercent,
    adjustedRange,
    adjustedRangeSe,
    averageDamage,
    dps,
  };
}
