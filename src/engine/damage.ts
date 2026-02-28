import type { WeaponData } from '../data/types.js';

export interface DamageRange {
  min: number;
  max: number;
  average: number;
}

/**
 * Look up the weapon multiplier for a given weapon type and attack type.
 * Slash is the default (most skills slash). Stab uses stabMultiplier.
 *
 * If attackRatio is provided, computes a weighted average of slash and stab
 * multipliers. Source: royals.ms forum — BW Blast uses 3:2 swing/stab ratio.
 */
export function getWeaponMultiplier(
  weaponData: WeaponData,
  weaponType: string,
  attackType: 'slash' | 'stab' = 'slash',
  attackRatio?: { slash: number; stab: number }
): number {
  const weapon = weaponData.types.find((w) => w.name === weaponType);
  if (!weapon) throw new Error(`Unknown weapon type: ${weaponType}`);
  if (attackRatio) {
    return weapon.slashMultiplier * attackRatio.slash + weapon.stabMultiplier * attackRatio.stab;
  }
  return attackType === 'stab' ? weapon.stabMultiplier : weapon.slashMultiplier;
}

/**
 * Calculate the raw damage range (min/max) for a physical attack.
 *
 * Source: range calculator E18/E19
 *   MaxDamage = floor((primaryStat * weaponMultiplier + secondaryStat) * totalAttack / 100)
 *   MinDamage = floor((primaryStat * weaponMultiplier * 0.9 * mastery + secondaryStat) * totalAttack / 100)
 *
 * @param primaryStat    Total primary stat after MW and gear (e.g., STR for Hero)
 * @param secondaryStat  Total secondary stat after MW and gear (e.g., DEX for Hero)
 * @param weaponMultiplier  Weapon type multiplier (e.g., 4.6 for 2H Sword)
 * @param mastery        Skill mastery value (e.g., 0.6 for Hero)
 * @param totalAttack    Total weapon attack including potion, projectile, echo
 */
export function calculateDamageRange(
  primaryStat: number,
  secondaryStat: number,
  weaponMultiplier: number,
  mastery: number,
  totalAttack: number
): DamageRange {
  const max = Math.floor(
    ((primaryStat * weaponMultiplier + secondaryStat) * totalAttack) / 100
  );
  const min = Math.floor(
    ((primaryStat * weaponMultiplier * 0.9 * mastery + secondaryStat) *
      totalAttack) /
      100
  );
  return { min, max, average: (min + max) / 2 };
}

/**
 * Calculate the raw damage range for a throwing star attack (NL/Shad).
 *
 * Source: range calculator F18/F19
 *   MaxDamage = floor(5.0 * LUK * totalAttack / 100)
 *   MinDamage = floor(2.5 * LUK * totalAttack / 100)
 *
 * @param luk          Total LUK after MW and gear
 * @param totalAttack  Total weapon attack including potion, projectile, echo
 */
export function calculateThrowingStarRange(
  luk: number,
  totalAttack: number
): DamageRange {
  const max = Math.floor((5.0 * luk * totalAttack) / 100);
  const min = Math.floor((2.5 * luk * totalAttack) / 100);
  return { min, max, average: (min + max) / 2 };
}

/**
 * Calculate the raw magic damage range.
 *
 * Source: range calculator E18/E19 (Archmage/Bishop branch)
 *   MaxDamage = floor(((TMA²/1000 + TMA)/30 + INT/200) * spellAmp * weaponAmp)
 *   MinDamage = floor(((TMA²/1000 + TMA * mastery * 0.9)/30 + INT/200) * spellAmp * weaponAmp)
 *
 * Where TMA = total magic attack = INT + MATK + potion + echo.
 *
 * @param tma        Total Magic Attack (INT + MATK gear + potion + echo)
 * @param int        Total INT after MW and gear (used in +INT/200 term)
 * @param mastery    Spell mastery (e.g., 0.6 for mages in the spreadsheet)
 * @param spellAmp   Element Amplification multiplier (1.4 for Archmage, 1 for Bishop)
 * @param weaponAmp  Elemental Staff/Wand bonus (1.25 for Archmage, 1 for Bishop)
 */
export function calculateMagicDamageRange(
  tma: number,
  int: number,
  mastery: number,
  spellAmp: number = 1,
  weaponAmp: number = 1
): DamageRange {
  const amp = spellAmp * weaponAmp;
  const max = Math.floor(
    ((tma * tma / 1000 + tma) / 30 + int / 200) * amp
  );
  const min = Math.floor(
    ((tma * tma / 1000 + tma * mastery * 0.9) / 30 + int / 200) * amp
  );
  return { min, max, average: (min + max) / 2 };
}

/**
 * Calculate the adjusted range when a damage cap applies.
 *
 * When the range cap is below the max damage, some portion of the damage
 * distribution is capped. This function computes the effective average
 * accounting for the cap.
 *
 * Source: dmg sheet K15 formula:
 *   IF(rangeCap <= maxRange,
 *     (rangeCap+minRange)/2 * (rangeCap-minRange)/(maxRange-minRange) +
 *       rangeCap * (1 - (rangeCap-minRange)/(maxRange-minRange)),
 *     avgRange)
 *
 * The damage distribution is uniform from min to max.
 * - Below the cap: proportion = (cap-min)/(max-min), average = (cap+min)/2
 * - At the cap: proportion = (max-cap)/(max-min), value = cap
 */
export function calculateAdjustedRange(
  damageRange: DamageRange,
  rangeCap: number
): number {
  if (rangeCap > damageRange.max) {
    return damageRange.average;
  }

  if (rangeCap <= damageRange.min) {
    return rangeCap;
  }

  const ratio =
    (rangeCap - damageRange.min) / (damageRange.max - damageRange.min);
  return (
    ((rangeCap + damageRange.min) / 2) * ratio + rangeCap * (1 - ratio)
  );
}

/**
 * Calculate the range cap for a given skill damage% and damage cap.
 *
 * Source: dmg sheet H15 = damageCap / (skillDamagePercent%)
 *   i.e., damageCap / (skillDamagePercent / 100)
 */
export function calculateRangeCap(
  damageCap: number,
  skillDamagePercent: number
): number {
  return damageCap / (skillDamagePercent / 100);
}
