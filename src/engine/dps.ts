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
  calculateThrowingStarRange,
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

  // Crit damage: merge built-in crit bonus (e.g., TT +100) with SE bonus (+140)
  const builtInCritBonus = skill.builtInCritDamageBonus ?? 0;
  const seCritBonus = build.sharpEyes ? classData.sharpEyesCritDamageBonus : 0;
  const totalCritBonus = builtInCritBonus + seCritBonus;

  // Crit damage formula varies by class:
  // Hero/DrK/NL (addBeforeMultiply, default): critDmg% = (basePower + bonus) * multiplier
  // Paladin (addAfterMultiply): critDmg% = basePower * multiplier + bonus
  const seCritFormula = classData.seCritFormula ?? 'addBeforeMultiply';
  const critDamagePercent =
    seCritFormula === 'addAfterMultiply'
      ? skill.basePower * skill.multiplier + totalCritBonus
      : (skill.basePower + totalCritBonus) * skill.multiplier;

  // Crit rate: built-in (e.g., TT 0.50) + SE (0.15), capped at 1.0
  const builtInCritRate = skill.builtInCritRate ?? 0;
  const seCritRate = build.sharpEyes ? classData.sharpEyesCritRate : 0;
  const totalCritRate = Math.min(builtInCritRate + seCritRate, 1.0);

  // Damage range: throwing stars use a different formula
  const totalAttack = calculateTotalAttack(build);
  const { primary, secondary } = calculateTotalStats(build, mapleWarriorData);
  let damageRange: DamageRange;
  if (skill.weaponType === 'Claw') {
    damageRange = calculateThrowingStarRange(primary, totalAttack);
  } else {
    const weaponMultiplier = getWeaponMultiplier(weaponData, skill.weaponType, skill.attackType, skill.attackRatio);
    damageRange = calculateDamageRange(
      primary,
      secondary,
      weaponMultiplier,
      classData.mastery,
      totalAttack
    );
  }

  // 4. Range caps
  const rangeCap = calculateRangeCap(DAMAGE_CAP, skillDamagePercent);
  const rangeCapCrit = calculateRangeCap(DAMAGE_CAP, critDamagePercent);

  // 5. Adjusted ranges
  const adjustedRange = calculateAdjustedRange(damageRange, rangeCap);
  const adjustedRangeCrit = calculateAdjustedRange(damageRange, rangeCapCrit);

  // 6. Average damage per attack
  let averageDamage: number;
  if (totalCritRate > 0) {
    const normalRate = 1 - totalCritRate;
    averageDamage =
      ((skillDamagePercent / 100) * normalRate * adjustedRange +
        (critDamagePercent / 100) * totalCritRate * adjustedRangeCrit) *
      skill.hitCount;
  } else {
    averageDamage =
      (skillDamagePercent / 100) * adjustedRange * skill.hitCount;
  }

  // Shadow Partner: clone deals 50% of attack damage → 1.5× total
  if (build.shadowPartner) {
    averageDamage *= 1.5;
  }

  // 7. DPS
  const dps = averageDamage / attackTime;

  return {
    skillName: skill.name,
    attackTime,
    damageRange,
    skillDamagePercent,
    seDamagePercent: critDamagePercent,
    adjustedRange,
    adjustedRangeSe: adjustedRangeCrit,
    averageDamage,
    dps,
  };
}
