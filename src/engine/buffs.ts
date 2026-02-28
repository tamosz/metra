import type { CharacterBuild, ClassSkillData, MapleWarriorData } from '../data/types.js';

/** Echo of Hero bonus multiplier (4%). Source: range calculator E10. */
const ECHO_MULTIPLIER = 0.04;

/**
 * Apply Maple Warrior to base stats, returning the MW-boosted stat value.
 * MW is applied to base stats only, then floored.
 *
 * Source: range calculator H28 = ROUNDDOWN(H27*E15, 0)
 */
export function applyMapleWarrior(
  baseStat: number,
  mapleWarriorData: MapleWarriorData,
  mapleWarriorLevel: number
): number {
  const multiplier = getMapleWarriorMultiplier(mapleWarriorData, mapleWarriorLevel);
  return Math.floor(baseStat * multiplier);
}

/**
 * Get the MW multiplier for a given level.
 */
export function getMapleWarriorMultiplier(
  mapleWarriorData: MapleWarriorData,
  level: number
): number {
  const entry = mapleWarriorData.find((e) => e.level === level);
  if (!entry) throw new Error(`MW level ${level} not found`);
  return entry.multiplier;
}

/**
 * Calculate Echo of Hero bonus (4% of base WATK + potion + projectile).
 *
 * Source: range calculator E10 =
 *   ROUNDDOWN((L31+E8+E9)*0.04, 0) for non-mages
 */
export function calculateEcho(
  totalWeaponAttack: number,
  attackPotion: number,
  projectile: number
): number {
  return Math.floor((totalWeaponAttack + attackPotion + projectile) * ECHO_MULTIPLIER);
}

/**
 * Calculate total attack value including potion, projectile, and echo.
 *
 * Source: range calculator, total attack = L31 + E8 + E9 + E10
 */
export function calculateTotalAttack(build: CharacterBuild): number {
  const echo = build.echoActive
    ? calculateEcho(
        build.totalWeaponAttack,
        build.attackPotion,
        build.projectile
      )
    : 0;
  return build.totalWeaponAttack + build.attackPotion + build.projectile + echo;
}

/**
 * Calculate mage Echo of Hero bonus (4% of total INT + MATK + potion).
 * Mage echo includes INT in the base, unlike physical echo.
 *
 * Source: range calculator E10 =
 *   ROUNDDOWN((J31+L31+E8)*0.04, 0) for Archmage/Bishop
 */
export function calculateMageEcho(
  totalInt: number,
  totalMagicAttack: number,
  attackPotion: number
): number {
  return Math.floor((totalInt + totalMagicAttack + attackPotion) * ECHO_MULTIPLIER);
}

/**
 * Calculate total primary and secondary stats after MW and gear.
 *
 * Source: range calculator
 *   H28 = ROUNDDOWN(H27 * E15, 0)  -- MW-boosted base
 *   H31 = SUM(H4:H26, H28)         -- gear + MW'd base
 */
export function calculateTotalStats(
  build: CharacterBuild,
  classData: ClassSkillData,
  mapleWarriorData: MapleWarriorData
): { primary: number; secondary: number } {
  const mwMultiplier = getMapleWarriorMultiplier(
    mapleWarriorData,
    build.mapleWarriorLevel
  );

  const primaryStatKey = classData.primaryStat;
  const secondaryStatKeys = Array.isArray(classData.secondaryStat)
    ? classData.secondaryStat
    : [classData.secondaryStat];

  const primaryBase = Math.floor(
    build.baseStats[primaryStatKey] * mwMultiplier
  );

  const secondary = secondaryStatKeys.reduce((sum, key) => {
    const base = Math.floor(build.baseStats[key] * mwMultiplier);
    return sum + build.gearStats[key] + base;
  }, 0);

  return {
    primary: build.gearStats[primaryStatKey] + primaryBase,
    secondary,
  };
}
