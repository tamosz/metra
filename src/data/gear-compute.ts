import { readFileSync } from 'fs';
import { resolve } from 'path';
import type { CharacterBuild, StatName } from '@metra/engine';

export interface ClassBase {
  className: string;
  category: 'physical' | 'mage';
  primaryStat: string;
  secondaryStat: string | string[];
  weaponType: string;
  weaponSpeed: number;
  godlyCleanWATK: number;
  weaponStat: number;
  shieldWATK?: number;
  shieldStats?: Record<string, number>;
  passiveWATK?: number;
  projectile: number;
  echoActive: boolean;
  mwLevel: number;
  speedInfusion: boolean;
  sharpEyes: boolean;
  shadowPartner?: boolean;
  dexRequirement?: number;
}

interface GearBudget {
  gearPrimary: number;
  gearSecondary: number;
  nonWeaponWATK: number;
  scrollBonus: number;
  basePrimary: number;
  baseSecondary: number;
  attackPotion: number;
}

const DATA_DIR = resolve(import.meta.dirname, '../../data');

let budgetCache: GearBudget | null = null;

function loadGearBudget(): GearBudget {
  if (!budgetCache) {
    budgetCache = JSON.parse(
      readFileSync(resolve(DATA_DIR, 'gear-budget.json'), 'utf-8')
    ) as GearBudget;
  }
  return budgetCache;
}

const ALL_STATS: StatName[] = ['STR', 'DEX', 'INT', 'LUK'];

export function computeBuild(base: ClassBase): CharacterBuild {
  const budget = loadGearBudget();

  const totalWeaponAttack =
    base.godlyCleanWATK +
    budget.scrollBonus +
    budget.nonWeaponWATK +
    (base.passiveWATK ?? 0) +
    (base.shieldWATK ?? 0);

  const primary = base.primaryStat as StatName;
  const secondaryArr = Array.isArray(base.secondaryStat)
    ? base.secondaryStat
    : [base.secondaryStat];
  const firstSecondary = secondaryArr[0] as StatName;

  // gear stats: primary gets gearPrimary + weaponStat, first secondary gets gearSecondary
  const gearStats = { STR: 0, DEX: 0, INT: 0, LUK: 0 };
  gearStats[primary] = budget.gearPrimary + base.weaponStat;
  gearStats[firstSecondary] += budget.gearSecondary;

  // add shield stats
  if (base.shieldStats) {
    for (const [stat, value] of Object.entries(base.shieldStats)) {
      gearStats[stat as StatName] += value;
    }
  }

  // base stats: primary gets basePrimary, first secondary gets baseSecondary, others 4
  const baseStats = { STR: 4, DEX: 4, INT: 4, LUK: 4 };
  baseStats[primary] = budget.basePrimary;
  baseStats[firstSecondary] = budget.baseSecondary;
  // if primary === firstSecondary (shouldn't happen), basePrimary wins — but guard remaining stats
  for (const stat of ALL_STATS) {
    if (stat !== primary && stat !== firstSecondary) {
      baseStats[stat] = 4;
    }
  }

  return {
    className: base.className,
    baseStats,
    gearStats,
    totalWeaponAttack,
    weaponType: base.weaponType,
    weaponSpeed: base.weaponSpeed,
    attackPotion: budget.attackPotion,
    projectile: base.projectile,
    echoActive: base.echoActive,
    mwLevel: base.mwLevel,
    speedInfusion: base.speedInfusion,
    sharpEyes: base.sharpEyes,
    shadowPartner: base.shadowPartner,
  };
}
