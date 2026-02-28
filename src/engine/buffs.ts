import type { CharacterBuild, MapleWarriorData } from '../data/types.js';

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
  const entry = mapleWarriorData.find((e) => e.level === mapleWarriorLevel);
  if (!entry) {
    throw new Error(`MW level ${mapleWarriorLevel} not found`);
  }
  return Math.floor(baseStat * entry.multiplier);
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
  return Math.floor((totalWeaponAttack + attackPotion + projectile) * 0.04);
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
 * Calculate total primary and secondary stats after MW and gear.
 *
 * Source: range calculator
 *   H28 = ROUNDDOWN(H27 * E15, 0)  -- MW-boosted base
 *   H31 = SUM(H4:H26, H28)         -- gear + MW'd base
 */
export function calculateTotalStats(
  build: CharacterBuild,
  mapleWarriorData: MapleWarriorData
): { primary: number; secondary: number } {
  const mwMultiplier = getMapleWarriorMultiplier(
    mapleWarriorData,
    build.mapleWarriorLevel
  );

  const primaryStatKey = getPrimaryStatKey(build.className);
  const secondaryStatKey = getSecondaryStatKey(build.className);

  const primaryBase = Math.floor(
    build.baseStats[primaryStatKey] * mwMultiplier
  );
  const secondaryBase = Math.floor(
    build.baseStats[secondaryStatKey] * mwMultiplier
  );

  return {
    primary: build.gearStats[primaryStatKey] + primaryBase,
    secondary: build.gearStats[secondaryStatKey] + secondaryBase,
  };
}

function getPrimaryStatKey(
  className: string
): 'STR' | 'DEX' | 'INT' | 'LUK' {
  switch (className) {
    case 'Hero':
    case 'Paladin':
    case 'DrK':
    case 'Bucc':
      return 'STR';
    case 'BM':
    case 'MM':
    case 'Sair':
      return 'DEX';
    case 'NL':
    case 'Shad':
      return 'LUK';
    case 'Archmage':
    case 'Bishop':
      return 'INT';
    default:
      throw new Error(`Unknown class: ${className}`);
  }
}

function getSecondaryStatKey(
  className: string
): 'STR' | 'DEX' | 'INT' | 'LUK' {
  switch (className) {
    case 'Hero':
    case 'Paladin':
    case 'DrK':
    case 'Bucc':
      return 'DEX';
    case 'BM':
    case 'MM':
    case 'Sair':
      return 'STR';
    case 'NL':
    case 'Shad':
      return 'STR';
    case 'Archmage':
    case 'Bishop':
      return 'LUK';
    default:
      throw new Error(`Unknown class: ${className}`);
  }
}
