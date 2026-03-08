import type { AttackSpeedData } from './types.js';

/**
 * Calculate effective weapon speed after booster and Speed Infusion.
 *
 * Booster always reduces speed by 2. SI reduces by an additional 2.
 * Minimum effective speed is 2.
 *
 * Source: range calculator E11 =
 *   IF(D14="Yes", IF(D11-4<2, 2, D11-4), IF(D11-2<2, 2, D11-2))
 */
export function resolveEffectiveWeaponSpeed(
  baseSpeed: number,
  speedInfusion: boolean
): number {
  const reduction = speedInfusion ? 4 : 2;
  return Math.max(2, baseSpeed - reduction);
}

/**
 * Look up the attack time in seconds for a given effective speed and skill category.
 *
 * Source: Attack Speed sheet, VLOOKUP on effective speed
 */
export function lookupAttackTime(
  attackSpeedData: AttackSpeedData,
  effectiveSpeed: number,
  skillCategory: string
): number {
  let entry = attackSpeedData.entries.find((e) => e.speed === effectiveSpeed);
  if (!entry) {
    // VLOOKUP with TRUE (approximate match) — find the largest speed <= effectiveSpeed
    const sorted = [...attackSpeedData.entries]
      .filter((e) => e.speed <= effectiveSpeed)
      .sort((a, b) => b.speed - a.speed);
    if (sorted.length === 0) {
      throw new Error(
        `No attack speed entry found for effective speed ${effectiveSpeed}`
      );
    }
    entry = sorted[0];
  }

  return getTimeForCategory(entry, skillCategory);
}

function getTimeForCategory(
  entry: AttackSpeedData['entries'][number],
  skillCategory: string
): number {
  const time = entry.times[skillCategory];
  if (time === undefined) {
    throw new Error(`Unknown skill category: ${skillCategory}`);
  }
  return time;
}
