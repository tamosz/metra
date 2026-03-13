import type {
  CharacterBuild,
  ClassSkillData,
  SkillEntry,
  WeaponData,
  AttackSpeedData,
  MWData,
} from './types.js';
import { calculateTotalAttack, calculateTotalStats, calculateMageEcho } from './buffs.js';
import {
  calculateDamageRange,
  calculateThrowingStarRange,
  calculateMagicDamageRange,
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

/** Shadow Partner clone deals 50% of attack damage → 1.5× total. */
const SHADOW_PARTNER_MULTIPLIER = 1.5;

export interface DpsResult {
  /** Skill name. */
  skillName: string;
  /** Attack time in seconds. */
  attackTime: number;
  /** Damage range (min/max/average). */
  damageRange: DamageRange;
  /** Skill damage% without crit. */
  skillDamagePercent: number;
  /** Skill damage% with crit (built-in + SE). */
  critDamagePercent: number;
  /** Adjusted range for normal (non-crit) hits. */
  adjustedRangeNormal: number;
  /** Adjusted range for crit hits. */
  adjustedRangeCrit: number;
  /** Average damage per attack (all lines). */
  averageDamage: number;
  /** DPS (average damage / attack time). */
  dps: number;
  /** DPS without the per-line damage cap. */
  uncappedDps: number;
  /** Percentage of DPS lost to the cap (0-100). */
  capLossPercent: number;
  /** Total crit rate (built-in + SE), 0-1. */
  totalCritRate: number;
  /** Number of damage lines per attack. */
  hitCount: number;
  /** Whether Shadow Partner is active (1.5x multiplier). */
  hasShadowPartner: boolean;
}

/**
 * Calculate crit damage% and crit rate, merging built-in bonuses with Sharp Eyes.
 *
 * Crit damage formula varies by class:
 * - addBeforeMultiply (default): critDmg% = (basePower + bonus) * multiplier
 * - multiplicative (mages): critDmg% = basePower * multiplier * totalCritBonus / 100
 *   Mage SE crits multiply damage by 1.4× rather than adding to skill%.
 *
 */
function calculateCritDamage(
  skill: SkillEntry,
  classData: ClassSkillData,
  sharpEyes: boolean
): { critDamagePercent: number; totalCritRate: number } {
  const builtInCritRate = skill.builtInCritRate ?? 0;
  const seCritRate = sharpEyes ? classData.sharpEyesCritRate : 0;
  const totalCritRate = Math.min(builtInCritRate + seCritRate, 1.0);

  const builtInCritBonus = skill.builtInCritDamageBonus ?? 0;
  const seCritBonus = sharpEyes ? classData.sharpEyesCritDamageBonus : 0;
  const totalCritBonus = builtInCritBonus + seCritBonus;

  const seCritFormula = skill.seCritFormula ?? classData.seCritFormula ?? 'addBeforeMultiply';
  let critDamagePercent: number;
  if (seCritFormula === 'multiplicative') {
    critDamagePercent = skill.basePower * skill.multiplier * totalCritBonus / 100;
  } else if (seCritFormula === 'scaleOnBase') {
    critDamagePercent = skill.basePower * skill.multiplier * (1 + totalCritBonus / 100);
  } else {
    critDamagePercent = (skill.basePower + totalCritBonus) * skill.multiplier;
  }

  return { critDamagePercent, totalCritRate };
}

/**
 * Calculate the base damage range using the appropriate formula for the class type.
 * Dispatches to standard, throwingStar, or magic damage range calculation.
 */
function calculateBaseDamageRange(
  build: CharacterBuild,
  classData: ClassSkillData,
  skill: SkillEntry,
  weaponData: WeaponData,
  mwData: MWData
): DamageRange {
  const { primary, secondary } = calculateTotalStats(build, classData, mwData);
  const damageFormula = classData.damageFormula ?? 'standard';

  if (damageFormula === 'magic') {
    // Mage TMA = INT + MATK + potion + mageEcho
    // Source: range calculator B8 = J31 + L31 + E8 + E10
    const mageEcho = build.echoActive
      ? calculateMageEcho(primary, build.totalWeaponAttack, build.attackPotion)
      : 0;
    const tma = primary + build.totalWeaponAttack + build.attackPotion + mageEcho;
    const spellAmp = classData.spellAmplification ?? 1;
    const weaponAmp = classData.weaponAmplification ?? 1;
    return calculateMagicDamageRange(tma, primary, classData.mastery, spellAmp, weaponAmp);
  }

  if (damageFormula === 'throwingStar') {
    const totalAttack = calculateTotalAttack(build);
    return calculateThrowingStarRange(primary, totalAttack);
  }

  if (damageFormula !== 'standard') {
    throw new Error(`Unknown damage formula: ${damageFormula}`);
  }

  const totalAttack = calculateTotalAttack(build);
  // Use build.weaponType (not skill.weaponType) — the build's actual weapon determines
  // the multiplier, allowing gear templates to override per tier (e.g., 1H vs 2H BW).
  const weaponMultiplier = getWeaponMultiplier(weaponData, build.weaponType, skill.attackType, skill.attackRatio);
  return calculateDamageRange(primary, secondary, weaponMultiplier, classData.mastery, totalAttack);
}

/**
 * Convert a damage percent to an effective multiplier.
 * Physical skills use percentage (260 = 260% → ÷100); magic uses raw multiplier.
 * Source: dmg sheet — physical uses E15%, magic uses E36 directly.
 */
function toEffectiveMultiplier(damagePercent: number, isMagic: boolean): number {
  return isMagic ? damagePercent : damagePercent / 100;
}

/**
 * Compute average damage per attack including crit weighting, range caps,
 * and Shadow Partner.
 *
 * elementModifier scales per-line damage (e.g. 1.5× for elemental weakness)
 * and must be factored into range cap calculation so the 199,999 cap applies
 * to final per-line damage (range × skillMultiplier × elementModifier).
 */
function calculateAverageDamage(
  damageRange: DamageRange,
  skillDamagePercent: number,
  critDamagePercent: number,
  totalCritRate: number,
  hitCount: number,
  isMagic: boolean,
  shadowPartner: boolean | undefined,
  elementModifier: number = 1
): { adjustedRangeNormal: number; adjustedRangeCrit: number; averageDamage: number; uncappedAverageDamage: number } {
  const skillMultiplier = toEffectiveMultiplier(skillDamagePercent, isMagic) * elementModifier;
  const critMultiplier = toEffectiveMultiplier(critDamagePercent, isMagic) * elementModifier;

  const rangeCap = DAMAGE_CAP / skillMultiplier;
  const rangeCapCrit = DAMAGE_CAP / critMultiplier;

  const adjustedRangeNormal = calculateAdjustedRange(damageRange, rangeCap);
  const adjustedRangeCrit = calculateAdjustedRange(damageRange, rangeCapCrit);

  let averageDamage: number;
  let uncappedAverageDamage: number;
  if (totalCritRate > 0) {
    const normalRate = 1 - totalCritRate;
    averageDamage =
      (skillMultiplier * normalRate * adjustedRangeNormal +
        critMultiplier * totalCritRate * adjustedRangeCrit) *
      hitCount;
    uncappedAverageDamage =
      (skillMultiplier * normalRate + critMultiplier * totalCritRate) *
      damageRange.average *
      hitCount;
  } else {
    averageDamage = skillMultiplier * adjustedRangeNormal * hitCount;
    uncappedAverageDamage = skillMultiplier * damageRange.average * hitCount;
  }

  if (shadowPartner) {
    averageDamage *= SHADOW_PARTNER_MULTIPLIER;
    uncappedAverageDamage *= SHADOW_PARTNER_MULTIPLIER;
  }

  return { adjustedRangeNormal, adjustedRangeCrit, averageDamage, uncappedAverageDamage };
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
  mwData: MWData,
  elementModifier: number = 1
): DpsResult {
  const si = classData.damageFormula === 'magic' ? false : build.speedInfusion;
  const effectiveSpeed = resolveEffectiveWeaponSpeed(build.weaponSpeed, si);
  const attackTime = lookupAttackTime(attackSpeedData, effectiveSpeed, skill.speedCategory);

  // Fixed damage bypasses the normal formula. Fields like skillDamagePercent and
  // adjustedRangeNormal are set to 0 because they don't apply — only averageDamage and dps are meaningful.
  if (skill.fixedDamage != null) {
    const totalDamage = skill.fixedDamage * skill.hitCount;
    const dps = totalDamage / attackTime;
    return {
      skillName: skill.name,
      attackTime,
      damageRange: { min: skill.fixedDamage, max: skill.fixedDamage, average: skill.fixedDamage },
      skillDamagePercent: 0,
      critDamagePercent: 0,
      adjustedRangeNormal: 0,
      adjustedRangeCrit: 0,
      averageDamage: totalDamage,
      dps,
      uncappedDps: dps,
      capLossPercent: 0,
      totalCritRate: 0,
      hitCount: skill.hitCount,
      hasShadowPartner: !!build.shadowPartner,
    };
  }

  const skillDamagePercent = skill.basePower * skill.multiplier;
  const { critDamagePercent, totalCritRate } = calculateCritDamage(skill, classData, build.sharpEyes);
  const damageRange = calculateBaseDamageRange(build, classData, skill, weaponData, mwData);
  const isMagic = (classData.damageFormula ?? 'standard') === 'magic';
  const { adjustedRangeNormal, adjustedRangeCrit, averageDamage, uncappedAverageDamage } = calculateAverageDamage(
    damageRange, skillDamagePercent, critDamagePercent, totalCritRate,
    skill.hitCount, isMagic, build.shadowPartner, elementModifier
  );

  const dps = averageDamage / attackTime;
  const uncappedDps = uncappedAverageDamage / attackTime;
  // Math.max guards against negative values from floating point non-associativity
  // when the cap doesn't actually apply (a*x + b*x vs (a+b)*x).
  const capLossPercent = uncappedDps > 0 ? Math.max(0, ((uncappedDps - dps) / uncappedDps) * 100) : 0;

  return {
    skillName: skill.name,
    attackTime,
    damageRange,
    skillDamagePercent,
    critDamagePercent,
    adjustedRangeNormal,
    adjustedRangeCrit,
    averageDamage,
    dps,
    uncappedDps,
    capLossPercent,
    totalCritRate,
    hitCount: skill.hitCount,
    hasShadowPartner: !!build.shadowPartner,
  };
}
